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
export const MOVIE_AUTOCOMPLETE_RESULT_LIMIT = 6;

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

const sleep = async (durationMs: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
};

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchWithRetry = async (
  url: string,
  retries = 3,
  backoff = 1000,
  timeoutMs = METADATA_REQUEST_TIMEOUT_MS
): Promise<Response> => {
  try {
    const response = await fetchWithTimeout(url, timeoutMs);
    if (!response.ok && retries > 0 && shouldRetryResponseStatus(response.status)) {
      await sleep(backoff);
      return fetchWithRetry(url, retries - 1, backoff * 2, timeoutMs);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await sleep(backoff);
      return fetchWithRetry(url, retries - 1, backoff * 2, timeoutMs);
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
  type: 'movie';
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

export const searchMovieAutocomplete = async (
  query: string
): Promise<MovieAutocompleteResult[]> => {
  const cleanQuery = sanitizeInput(query);
  if (cleanQuery.length < 2) {
    return [];
  }

  const omdbSearchUrl = buildOmdbUrl({ s: cleanQuery, type: 'movie' });
  if (!omdbSearchUrl) {
    return [];
  }

  try {
    const omdbRes = await fetchWithRetry(omdbSearchUrl);
    if (!omdbRes.ok) {
      throw new Error(`OMDb search failed with status ${omdbRes.status}`);
    }

    const omdbData: OmdbSearchResponse = await omdbRes.json();
    if (omdbData.Response !== 'True' || !Array.isArray(omdbData.Search)) {
      return [];
    }

    return omdbData.Search
      .map(toMovieAutocompleteResultFromOmdb)
      .filter((result): result is MovieAutocompleteResult => result !== null)
      .slice(0, MOVIE_AUTOCOMPLETE_RESULT_LIMIT);
  } catch (error) {
    if (error instanceof Error && error.message && !error.message.includes('timeout')) {
      console.warn(`OMDb autocomplete failed for "${cleanQuery}": ${error.message}`);
    }
    throw new Error('Movie suggestions are unavailable right now.', {
      cause: error,
    });
  }
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
          if (error instanceof Error && error.message) {
            console.error(`OMDb ID lookup failed for "${id}": ${error.message}`);
          } else {
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
          throw new Error(`OMDb title lookup failed with status ${omdbRes.status}`);
        }

        const omdbData: OmdbMovieResponse = await omdbRes.json();
        if (omdbData.Response === 'True') {
          return toMetadataResultFromOmdb(omdbData);
        }
      } catch (error) {
        // Only log meaningful errors, not empty objects or network timeouts
        if (error instanceof Error && error.message && !error.message.includes('timeout')) {
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
        // Only log meaningful errors from TVMaze
        if (error instanceof Error && error.message && !error.message.includes('timeout')) {
          console.warn(`TVMaze search failed for "${title}":`, error.message);
        }
      }

    return {};
  } catch (error) {
    // Only log critical errors at the top level
    if (error instanceof Error && error.message && !error.message.includes('timeout') && !error.message.includes('fetch')) {
      console.error('Critical metadata fetch error:', error.message);
    }
    return {};
  }
};
