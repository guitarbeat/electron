import { isValidUrl, sanitizeInput } from '@/config/security.ts;

const env = (import.meta.env || {}) as Record<string, string | undefined>;
const OMDB_PROXY_URL = env.VITE_OMDB_PROXY_URL || '';
const OMDB_API_KEY = env.VITE_OMDB_API_KEY || '';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

const stripHtml = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  return value.replace(/<[^>]*>?/gm, '');
};

const toResolvedUrl = (url: string): URL | null => {
  if (!url) return null;
  try {
    return new URL(url);
  } catch {
    if (typeof window !== 'undefined' && window.location?.origin) {
      try {
        return new URL(url, window.location.origin);
      } catch {
        return null;
      }
    }
    return null;
  }
};

const buildOmdbUrl = (params: Record<string, string>): string | null => {
  const proxyUrl = toResolvedUrl(OMDB_PROXY_URL);
  const usingProxy = Boolean(proxyUrl);
  const baseUrl = usingProxy ? proxyUrl : new URL(OMDB_BASE_URL);

  const url = new URL(baseUrl!.toString());

  if (!usingProxy && OMDB_API_KEY) {
    url.searchParams.set('apikey', OMDB_API_KEY);
  }

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
};

const fetchWithRetry = async (url: string, retries = 3, backoff = 1000): Promise<Response> => {
  try {
    const response = await fetch(url);
    if (!response.ok && retries > 0) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, backoff);
      });
      return fetchWithRetry(url, retries - 1, backoff * 2);
    }
    throw error;
  }
};

interface OmdbSearchResultItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

interface OmdbSearchResponse {
  Search?: OmdbSearchResultItem[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

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

interface TvMazeImage {
  medium: string;
  original: string;
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
    country: { name: string; code: string; timezone: string };
  } | null;
  webChannel: {
    id: number;
    name: string;
    country: { name: string; code: string; timezone: string } | null;
  } | null;

  dvdCountry: any | null;
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

const toMetadataResultFromOmdb = (omdbData: OmdbMovieResponse): MetadataResult => ({
  posterUrl: omdbData.Poster !== 'N/A' && isValidUrl(omdbData.Poster) ? omdbData.Poster : undefined,
  year: omdbData.Year !== 'N/A' ? omdbData.Year : undefined,
  plot: omdbData.Plot !== 'N/A' ? sanitizeInput(omdbData.Plot) : undefined,
  imdbRating: omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : undefined,
  runtime: omdbData.Runtime !== 'N/A' ? omdbData.Runtime : undefined,
  genre: omdbData.Genre !== 'N/A' ? sanitizeInput(omdbData.Genre) : undefined,
  director: omdbData.Director !== 'N/A' ? sanitizeInput(omdbData.Director) : undefined,
  title: omdbData.Title !== 'N/A' ? sanitizeInput(omdbData.Title) : undefined,
  type: omdbData.Type === 'series' ? 'series' : 'movie',
});

export const fetchMovieMetadata = async (
  title: string,
  type?: 'movie' | 'series',
  id?: string
): Promise<MetadataResult> => {
  try {
    // If we have an ID and it's a TV show, use TVMaze directly by ID
    if (type === 'series' && id?.startsWith('tv-')) {
      const tvmazeId = id.replace('tv-', '');
      // Ensure the ID is safe for path usage
      const safeTvMazeId = encodeURIComponent(tvmazeId);
      const tvmazeUrl = `${TVMAZE_BASE_URL}/shows/${safeTvMazeId}`;
      const tvmazeRes = await fetchWithRetry(tvmazeUrl);
      const show: TvMazeShow = await tvmazeRes.json();

      if (show) {
        const posterUrl = show.image?.medium || show.image?.original;
        return {
          posterUrl: posterUrl && isValidUrl(posterUrl) ? posterUrl : undefined,
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
          const omdbData: OmdbMovieResponse = await omdbRes.json();
          if (omdbData.Response === 'True') {
            return toMetadataResultFromOmdb(omdbData);
          }
        } catch (error) {
          console.error('Error fetching metadata by OMDb ID:', error);
        }
      }
    }

    // 1. Try OMDb first (Best for Movies)
    const omdbByTitleUrl = buildOmdbUrl({ t: title });
    if (omdbByTitleUrl) {
      try {
        const omdbRes = await fetchWithRetry(omdbByTitleUrl);
        const omdbData: OmdbMovieResponse = await omdbRes.json();
        if (omdbData.Response === 'True') {
          return toMetadataResultFromOmdb(omdbData);
        }
      } catch (error) {
        console.error('Error fetching metadata by OMDb title:', error);
      }
    }

    // 2. If OMDb fails or not found, try TVMaze (Best for TV Shows)
    try {
      const tvmazeUrl = new URL(`${TVMAZE_BASE_URL}/search/shows`);
      tvmazeUrl.searchParams.append('q', title);

      const tvmazeRes = await fetchWithRetry(tvmazeUrl.toString());
      const tvmazeData: TvMazeSearchResultItem[] = await tvmazeRes.json();

      if (tvmazeData && tvmazeData.length > 0) {
        const { show } = tvmazeData[0];
        const posterUrl = show.image?.medium || show.image?.original;
        return {
          posterUrl: posterUrl && isValidUrl(posterUrl) ? posterUrl : undefined,
          year: show.premiered ? show.premiered.split('-')[0] : undefined,
          plot: sanitizeInput(stripHtml(show.summary) || ''),
          imdbRating: show.rating?.average?.toString(),
          genre: sanitizeInput(show.genres?.join(', ') || ''),
          type: 'series',
        };
      }
    } catch (error) {
      console.error('Error fetching metadata from TVMaze:', error);
    }

    return {};
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {};
  }
};

export const searchMovies = async (query: string): Promise<MetadataResult[]> => {
  const searchOmdb = async (): Promise<MetadataResult[]> => {
    const omdbSearchUrl = buildOmdbUrl({ s: query });
    if (!omdbSearchUrl) return [];

    const omdbRes = await fetchWithRetry(omdbSearchUrl);
    const omdbData: OmdbSearchResponse = await omdbRes.json();
    if (omdbData.Response === 'True' && omdbData.Search) {
      return omdbData.Search.map((item) => ({
        id: item.imdbID,
        title: sanitizeInput(item.Title),
        year: item.Year,
        posterUrl: item.Poster !== 'N/A' && isValidUrl(item.Poster) ? item.Poster : undefined,
        type: (item.Type === 'series' ? 'series' : 'movie') as 'movie' | 'series',
      }));
    }
    return [];
  };

  const searchTvMaze = async (): Promise<MetadataResult[]> => {
    const tvmazeUrl = new URL(`${TVMAZE_BASE_URL}/search/shows`);
    tvmazeUrl.searchParams.append('q', query);

    const tvmazeRes = await fetchWithRetry(tvmazeUrl.toString());
    const tvmazeData: TvMazeSearchResultItem[] = await tvmazeRes.json();

    if (tvmazeData && tvmazeData.length > 0) {
      return tvmazeData.map((item) => {
        const posterUrl = item.show.image?.medium || item.show.image?.original;
        return {
          id: `tv-${item.show.id}`,
          title: sanitizeInput(item.show.name),
          year: item.show.premiered ? item.show.premiered.split('-')[0] : undefined,
          posterUrl: posterUrl && isValidUrl(posterUrl) ? posterUrl : undefined,
          type: 'series' as const,
          plot: sanitizeInput(stripHtml(item.show.summary) || ''),
        };
      });
    }
    return [];
  };

  const [omdbResult, tvmazeResult] = await Promise.allSettled([searchOmdb(), searchTvMaze()]);

  const results: MetadataResult[] = [];

  if (omdbResult.status === 'fulfilled') {
    results.push(...omdbResult.value);
  } else {
    console.error('Error searching OMDb metadata:', omdbResult.reason);
  }

  if (tvmazeResult.status === 'fulfilled') {
    results.push(...tvmazeResult.value);
  } else {
    console.error('Error searching TVMaze metadata:', tvmazeResult.reason);
  }

  // Remove duplicates by title+year (simple heuristic)
  const seen = new Set();
  return results.filter((item) => {
    const key = `${item.title}-${item.year}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
