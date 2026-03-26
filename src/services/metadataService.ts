import { isValidUrl, sanitizeInput } from '../utils/shared.ts';

const env = (import.meta.env ?? {}) as ImportMetaEnv & {
  VITE_OMDB_API_URL?: string;
  VITE_OMDB_API_KEY?: string;
  VITE_TVMAZE_API_URL?: string;
};

const clean = (value: string) => value.trim().replace(/^["']|["']$/g, '');
const OMDB_API_KEY = clean((env.VITE_OMDB_API_KEY || ''));
const OMDB_DEFAULT_BASE_URL = '/api/omdb';
const TVMAZE_DEFAULT_BASE_URL = '/api/tvmaze';
const resolveConfig = (value: string | undefined, fallback: string) => {
  const cleanedValue = clean(value || '');
  return cleanedValue.length > 0 ? cleanedValue : fallback;
};

const OMDB_BASE = resolveConfig(env.VITE_OMDB_API_URL, OMDB_DEFAULT_BASE_URL);
const TVMAZE_BASE = resolveConfig(env.VITE_TVMAZE_API_URL, TVMAZE_DEFAULT_BASE_URL);
export const METADATA_REQUEST_TIMEOUT_MS = 5000;
export const AUTOCOMPLETE_REQUEST_TIMEOUT_MS = 2500;
export const MOVIE_AUTOCOMPLETE_RESULT_LIMIT = 6;
const OMDB_AUTH_FAILURE_CODE = 'omdb_auth';
const OMDB_CONFIG_FAILURE_CODE = 'omdb_config';

const stripHtml = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  return value.replace(/<[^>]*>?/gm, '');
};

const normalizePosterUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const cleanValue = sanitizeInput(value);
  if (!cleanValue || !isValidUrl(cleanValue)) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(cleanValue);
    if (parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:';
    }
    return parsedUrl.toString();
  } catch {
    return undefined;
  }
};

const getLocationOrigin = (): string =>
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost';

const shouldAttachClientOmdbApiKey = (url: URL): boolean =>
  OMDB_API_KEY.length > 0 && /(^|\.)omdbapi\.com$/i.test(url.hostname);

const buildOmdbUrl = (params: Record<string, string>): string | null => {
  const url = new URL(OMDB_BASE, getLocationOrigin());

  if (shouldAttachClientOmdbApiKey(url) && !url.searchParams.has('apikey')) {
    url.searchParams.set('apikey', OMDB_API_KEY);
  }

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
};

const buildTvMazeUrl = (
  mode: 'show' | 'search',
  value: string
): string => {
  const url = new URL(TVMAZE_BASE, getLocationOrigin());
  url.searchParams.set('mode', mode);
  if (mode === 'show') {
    url.searchParams.set('id', value);
  } else {
    url.searchParams.set('q', value);
  }
  return url.toString();
};

export const shouldRetryResponseStatus = (status: number): boolean =>
  status === 408 || status === 425 || status === 429 || status >= 500;

const createNamedError = (message: string, name: 'AbortError' | 'TimeoutError'): Error => {
  if (typeof DOMException === 'function') {
    return new DOMException(message, name);
  }

  const error = new Error(message);
  error.name = name;
  return error;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error ?? '');

const isAbortLikeError = (error: unknown): boolean => {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  return getErrorMessage(error).toLowerCase().includes('aborted');
};

const isTimeoutLikeError = (error: unknown): boolean => {
  if (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'TimeoutError'
  ) {
    return true;
  }

  if (error instanceof Error && error.name === 'TimeoutError') {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return message.includes('timed out') || message.includes('timeout');
};

const isExpectedMetadataFallbackError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    isAbortLikeError(error) ||
    isTimeoutLikeError(error) ||
    message.includes('omdb rejected the configured api key') ||
    message.includes('omdb is not configured')
  );
};

const sleep = async (durationMs: number, signal?: AbortSignal): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? createNamedError('Request was aborted.', 'AbortError'));
      return;
    }

    const timeoutId = setTimeout(() => {
      if (signal && onAbort) {
        signal.removeEventListener('abort', onAbort);
      }
      resolve();
    }, durationMs);

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      reject(signal?.reason ?? createNamedError('Request was aborted.', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
};

const fetchWithTimeout = async (
  url: string,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<Response> => {
  const controller = new AbortController();
  const abortWithReason = (reason: unknown) => {
    controller.abort(reason ?? createNamedError('Request was aborted.', 'AbortError'));
  };

  const onAbort = () => {
    abortWithReason(signal?.reason);
  };

  if (signal?.aborted) {
    onAbort();
  } else if (signal) {
    signal.addEventListener('abort', onAbort, { once: true });
  }

  const timeoutId = setTimeout(() => {
    controller.abort(
      createNamedError(`Request timed out after ${timeoutMs}ms.`, 'TimeoutError')
    );
  }, timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && controller.signal.reason !== undefined) {
      throw controller.signal.reason;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
  }
};

export const fetchWithRetry = async (
  url: string,
  retries = 3,
  backoff = 1000,
  timeoutMs = METADATA_REQUEST_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<Response> => {
  try {
    const response = await fetchWithTimeout(url, timeoutMs, signal);
    if (!response.ok && retries > 0 && shouldRetryResponseStatus(response.status)) {
      await sleep(backoff, signal);
      return fetchWithRetry(url, retries - 1, backoff * 2, timeoutMs, signal);
    }
    return response;
  } catch (error) {
    if (!isAbortLikeError(error) && retries > 0) {
      await sleep(backoff, signal);
      return fetchWithRetry(url, retries - 1, backoff * 2, timeoutMs, signal);
    }
    throw error;
  }
};




interface OmdbMovieResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: { Source: string; Value: string }[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: 'True' | 'False';
  Error?: string;
}

interface OmdbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

interface OmdbSearchResponse {
  Search?: OmdbSearchResult[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

interface TvMazeImage {
  medium: string;
  original: string;
}

interface TvMazeCountry {
  name: string;
  code: string;
  timezone: string;
}

interface TvMazeShow {
  id: number;
  url: string;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  runtime: number | null;
  averageRuntime: number | null;
  premiered: string | null;
  ended: string | null;
  officialSite: string | null;
  schedule: { time: string; days: string[] };
  rating: { average: number | null };
  weight: number;
  network: {
    id: number;
    name: string;
    country: TvMazeCountry;
  } | null;
  webChannel: {
    id: number;
    name: string;
    country: TvMazeCountry | null;
  } | null;

  dvdCountry: TvMazeCountry | null;
  externals: { tvrage: number; thetvdb: number; imdb: string | null };
  image: TvMazeImage | null;
  summary: string | null;
  updated: number;
  _links: { self: { href: string }; previousepisode?: { href: string } };
}

interface TvMazeSearchResultItem {
  score: number;
  show: TvMazeShow;
}

export interface MetadataResult {
  id?: string; // Search result ID (imdbID or TVMaze ID)
  posterUrl?: string;
  year?: string;
  plot?: string;
  imdbRating?: string;
  runtime?: string;
  genre?: string;
  director?: string;
  title?: string; // For search results
  type?: 'movie' | 'series';
}

export interface MovieAutocompleteResult {
  imdbID: string;
  title: string;
  year?: string;
  posterUrl?: string;
  type: 'movie' | 'series';
}

interface ProxyErrorResponse {
  error?: string;
  code?: string;
}

const toMetadataResultFromOmdb = (omdbData: OmdbMovieResponse): MetadataResult => ({
  posterUrl: normalizePosterUrl(omdbData.Poster),
  year: omdbData.Year !== 'N/A' ? omdbData.Year : undefined,
  plot: omdbData.Plot !== 'N/A' ? sanitizeInput(omdbData.Plot) : undefined,
  imdbRating: omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : undefined,
  runtime: omdbData.Runtime !== 'N/A' ? omdbData.Runtime : undefined,
  genre: omdbData.Genre !== 'N/A' ? sanitizeInput(omdbData.Genre) : undefined,
  director: omdbData.Director !== 'N/A' ? sanitizeInput(omdbData.Director) : undefined,
  title: omdbData.Title !== 'N/A' ? sanitizeInput(omdbData.Title) : undefined,
  type: omdbData.Type === 'series' ? 'series' : 'movie',
});

const toMovieAutocompleteResultFromOmdb = (
  omdbData: OmdbSearchResult
): MovieAutocompleteResult | null => {
  const title = sanitizeInput(omdbData.Title);
  const imdbID = sanitizeInput(omdbData.imdbID);

  if (!title || !imdbID || omdbData.Type !== 'movie') {
    return null;
  }

  return {
    imdbID,
    title,
    year: omdbData.Year !== 'N/A' ? sanitizeInput(omdbData.Year) : undefined,
    posterUrl: normalizePosterUrl(omdbData.Poster),
    type: 'movie',
  };
};

const toMovieAutocompleteResultFromTvMaze = (
  searchResult: TvMazeSearchResultItem
): MovieAutocompleteResult | null => {
  const title = sanitizeInput(searchResult.show.name);
  if (!title) {
    return null;
  }

  return {
    imdbID: `tv-${searchResult.show.id}`,
    title,
    year: searchResult.show.premiered ? searchResult.show.premiered.split('-')[0] : undefined,
    posterUrl: normalizePosterUrl(
      searchResult.show.image?.medium || searchResult.show.image?.original
    ),
    type: 'series',
  };
};

const readJsonSafely = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const getOmdbAutocompleteFailureMessage = (
  errorBody: ProxyErrorResponse | null
): string | null => {
  if (errorBody?.code === OMDB_AUTH_FAILURE_CODE) {
    return 'Movie suggestions are unavailable because the OMDb key was rejected.';
  }

  if (errorBody?.code === OMDB_CONFIG_FAILURE_CODE) {
    return 'Movie suggestions are unavailable because OMDb is not configured.';
  }

  return null;
};

const searchTvMazeAutocomplete = async (
  query: string,
  signal?: AbortSignal
): Promise<MovieAutocompleteResult[]> => {
  const tvmazeRes = await fetchWithRetry(
    buildTvMazeUrl('search', query),
    0,
    250,
    AUTOCOMPLETE_REQUEST_TIMEOUT_MS,
    signal
  );
  if (!tvmazeRes.ok) {
    throw new Error(`TVMaze search failed with status ${tvmazeRes.status}`);
  }

  const tvmazeData = await readJsonSafely<TvMazeSearchResultItem[]>(tvmazeRes);
  if (!Array.isArray(tvmazeData)) {
    return [];
  }

  return tvmazeData
    .map(toMovieAutocompleteResultFromTvMaze)
    .filter((result): result is MovieAutocompleteResult => result !== null)
    .slice(0, MOVIE_AUTOCOMPLETE_RESULT_LIMIT);
};

export const searchMovieAutocomplete = async (
  query: string,
  options: { signal?: AbortSignal } = {}
): Promise<MovieAutocompleteResult[]> => {
  const cleanQuery = sanitizeInput(query);
  if (cleanQuery.length < 2) {
    return [];
  }

  const omdbSearchUrl = buildOmdbUrl({ s: cleanQuery, type: 'movie' });
  if (!omdbSearchUrl) {
    return [];
  }

  let omdbFailureMessage: string | null = null;
  let omdbResults: MovieAutocompleteResult[] = [];

  try {
    const omdbRes = await fetchWithRetry(
      omdbSearchUrl,
      0,
      250,
      AUTOCOMPLETE_REQUEST_TIMEOUT_MS,
      options.signal
    );
    if (!omdbRes.ok) {
      const errorBody = await readJsonSafely<ProxyErrorResponse>(omdbRes);
      omdbFailureMessage = getOmdbAutocompleteFailureMessage(errorBody);
      if (!omdbFailureMessage) {
        throw new Error(`OMDb search failed with status ${omdbRes.status}`);
      }
    } else {
      const omdbData: OmdbSearchResponse = await omdbRes.json();
      if (omdbData.Response === 'True' && Array.isArray(omdbData.Search)) {
        omdbResults = omdbData.Search
          .map(toMovieAutocompleteResultFromOmdb)
          .filter((result): result is MovieAutocompleteResult => result !== null)
          .slice(0, MOVIE_AUTOCOMPLETE_RESULT_LIMIT);
      }
    }
  } catch (error) {
    if (isAbortLikeError(error)) {
      throw error;
    }

    if (error instanceof Error && error.message && !isTimeoutLikeError(error)) {
      console.warn(`OMDb autocomplete failed for "${cleanQuery}": ${error.message}`);
    }
    omdbFailureMessage = 'Movie suggestions are unavailable right now.';
  }

  if (omdbResults.length > 0) {
    return omdbResults;
  }

  try {
    const tvMazeResults = await searchTvMazeAutocomplete(cleanQuery, options.signal);
    if (tvMazeResults.length > 0) {
      return tvMazeResults;
    }
  } catch (error) {
    if (isAbortLikeError(error)) {
      throw error;
    }

    if (error instanceof Error && error.message && !isTimeoutLikeError(error)) {
      console.warn(`TVMaze autocomplete failed for "${cleanQuery}": ${error.message}`);
    }
  }

  if (omdbFailureMessage) {
    throw new Error(omdbFailureMessage);
  }

  return [];
};

export const fetchMovieMetadata = async (
  title: string,
  type?: 'movie' | 'series',
  id?: string
): Promise<MetadataResult> => {
  try {
    // If we have an ID and it's a TV show, use TVMaze directly by ID
    if (type === 'series' && id?.startsWith('tv-')) {
      const tvmazeId = id.replace('tv-', '');
      const tvmazeUrl = buildTvMazeUrl('show', tvmazeId);
      const tvmazeRes = await fetchWithRetry(tvmazeUrl);
      if (!tvmazeRes.ok) {
        throw new Error(`TVMaze show lookup failed with status ${tvmazeRes.status}`);
      }

      const show: TvMazeShow = await tvmazeRes.json();

      if (show) {
        const posterUrl = normalizePosterUrl(show.image?.medium || show.image?.original);
        return {
          posterUrl,
          year: show.premiered ? show.premiered.split('-')[0] : undefined,
          plot: sanitizeInput(stripHtml(show.summary) || ''),
          imdbRating: show.rating?.average?.toString(),
          genre: sanitizeInput(show.genres?.join(', ') || ''),
          title: sanitizeInput(show.name),
          type: 'series',
        };
      }
    }

    // If we have an IMDB ID, use OMDb by ID
    if (id && !id.startsWith('tv-')) {
      const omdbByIdUrl = buildOmdbUrl({ i: id });
      if (omdbByIdUrl) {
        try {
          const omdbRes = await fetchWithRetry(omdbByIdUrl);
          if (!omdbRes.ok) {
            const errorBody = await readJsonSafely<ProxyErrorResponse>(omdbRes);
            if (errorBody?.error) {
              throw new Error(errorBody.error);
            }
            throw new Error(`OMDb ID lookup failed with status ${omdbRes.status}`);
          }

          const omdbData: OmdbMovieResponse = await omdbRes.json();
          if (omdbData.Response === 'True') {
            return toMetadataResultFromOmdb(omdbData);
          } else if (omdbData.Error) {
            console.error(`OMDb ID lookup failed for "${id}": ${omdbData.Error}`);
          } else {
            console.error(`OMDb ID lookup failed for "${id}" with unknown error`);
          }
        } catch (error) {
          if (!isExpectedMetadataFallbackError(error) && error instanceof Error && error.message) {
            console.error(`OMDb ID lookup failed for "${id}": ${error.message}`);
          } else if (!isExpectedMetadataFallbackError(error)) {
            console.error(`OMDb ID lookup failed for "${id}" with unknown error`);
          }
        }
      }
    }

    // 1. Try OMDb first (Best for Movies)
    const omdbByTitleUrl = buildOmdbUrl({ t: title });
    if (omdbByTitleUrl) {
      try {
        const omdbRes = await fetchWithRetry(omdbByTitleUrl);
        if (!omdbRes.ok) {
          const errorBody = await readJsonSafely<ProxyErrorResponse>(omdbRes);
          if (errorBody?.error) {
            throw new Error(errorBody.error);
          }
          throw new Error(`OMDb title lookup failed with status ${omdbRes.status}`);
        }

        const omdbData: OmdbMovieResponse = await omdbRes.json();
        if (omdbData.Response === 'True') {
          return toMetadataResultFromOmdb(omdbData);
        }
      } catch (error) {
        if (!isExpectedMetadataFallbackError(error) && error instanceof Error && error.message) {
          console.warn(`OMDb title lookup failed for "${title}":`, error.message);
        }
      }
    }

    // 2. If OMDb fails or not found, try TVMaze (Best for TV Shows)
    try {
      const tvmazeRes = await fetchWithRetry(buildTvMazeUrl('search', title));
      if (!tvmazeRes.ok) {
        throw new Error(`TVMaze search failed with status ${tvmazeRes.status}`);
      }

      const tvmazeData: TvMazeSearchResultItem[] = await tvmazeRes.json();

      if (tvmazeData && tvmazeData.length > 0) {
        const [firstResult] = tvmazeData;
        const { show } = firstResult;
        const posterUrl = normalizePosterUrl(show.image?.medium || show.image?.original);
        return {
          posterUrl,
          year: show.premiered ? show.premiered.split('-')[0] : undefined,
          plot: sanitizeInput(stripHtml(show.summary) || ''),
          imdbRating: show.rating?.average?.toString(),
          genre: sanitizeInput(show.genres?.join(', ') || ''),
          type: 'series',
        };
      }
    } catch (error) {
      if (!isExpectedMetadataFallbackError(error) && error instanceof Error && error.message) {
        console.warn(`TVMaze search failed for "${title}":`, error.message);
      }
    }

    return {};
  } catch (error) {
    if (
      !isExpectedMetadataFallbackError(error) &&
      error instanceof Error &&
      error.message &&
      !error.message.includes('fetch')
    ) {
      console.error('Critical metadata fetch error:', error.message);
    }
    return {};
  }
};
