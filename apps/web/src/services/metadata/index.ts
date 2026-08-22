import { z } from "zod";
import { isValidUrl, sanitizeInput } from "../../utils/shared.ts";

// Types

export interface MovieAutocompleteResult {
  title: string;
  year?: string;
  imdbID?: string;
  type: "movie" | "series";
  poster?: string;
}

export interface OmdbSearchResult {
  Search: Array<{
    Title: string;
    Year: string;
    imdbID: string;
    Type: "movie" | "series";
    Poster: string;
  }>;
}

export interface MovieMetadata {
  title: string;
  year?: string;
  imdbID?: string;
  imdbRating?: string;
  type: "movie" | "series";
  poster?: string;
  plot?: string;
  director?: string;
  actors?: string[];
  genre?: string[];
  runtime?: string;
  rated?: string;
  released?: string;
}

// Config

const env = (import.meta.env ?? {}) as ImportMetaEnv & {
  VITE_OMDB_API_URL?: string;
  VITE_OMDB_API_KEY?: string;
  VITE_TVMAZE_API_URL?: string;
};

const clean = (value: string) => value.trim().replace(/^["']|["']$/g, "");

export const OMDB_API_KEY = clean(env.VITE_OMDB_API_KEY || "");
export const OMDB_DEFAULT_BASE_URL = "/api/omdb";
export const TVMAZE_DEFAULT_BASE_URL = "/api/tvmaze";

export const resolveConfig = (value: string | undefined, fallback: string) => {
  const cleanedValue = clean(value || "");
  return cleanedValue.length > 0 ? cleanedValue : fallback;
};

export const OMDB_BASE = resolveConfig(
  env.VITE_OMDB_API_URL,
  OMDB_DEFAULT_BASE_URL,
);
export const TVMAZE_BASE = resolveConfig(
  env.VITE_TVMAZE_API_URL,
  TVMAZE_DEFAULT_BASE_URL,
);

export const METADATA_REQUEST_TIMEOUT_MS = 5000;
export const AUTOCOMPLETE_REQUEST_TIMEOUT_MS = 2500;
export const MOVIE_AUTOCOMPLETE_RESULT_LIMIT = 10;
export const MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT = 5;

export const OMDB_AUTH_FAILURE_CODE = "omdb_auth";
export const OMDB_CONFIG_FAILURE_CODE = "omdb_config";

// OMDb Service

const omdbTitleField = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .optional()
  .transform((v) => {
    if (typeof v === "string") return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    return "";
  });

const OmdbMovieSchema = z.object({
  Title: omdbTitleField,
  Year: z.string().optional(),
  imdbID: z.string().optional(),
  Type: z.enum(["movie", "series"]).catch("movie" as never),
  Poster: z.string().optional(),
});

const OmdbSearchResultSchema = z.object({
  Search: z.array(OmdbMovieSchema).optional(),
});

const OmdbMetadataSchema = z.object({
  Title: omdbTitleField,
  Year: z.string().optional(),
  imdbID: z.string().optional(),
  imdbRating: z.string().optional(),
  Type: z.string().optional(),
  Poster: z.string().optional(),
  Plot: z.string().optional(),
  Director: z.string().optional(),
  Actors: z.string().optional(),
  Genre: z.string().optional(),
  Runtime: z.string().optional(),
  Rated: z.string().optional(),
  Released: z.string().optional(),
});

const stripHtml = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  return value.replace(/<[^>]*>?/gm, "");
};

export const normalizePosterUrl = (
  value?: string | null,
): string | undefined => {
  if (!value) return undefined;
  const cleanValue = sanitizeInput(value);
  if (!cleanValue || !isValidUrl(cleanValue)) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(cleanValue);
    if (parsedUrl.protocol === "http:") {
      parsedUrl.protocol = "https:";
    }
    return parsedUrl.toString();
  } catch {
    return undefined;
  }
};

export const searchOmdbMovies = async (
  query: string,
  signal?: AbortSignal,
): Promise<MovieAutocompleteResult[]> => {
  const base =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(OMDB_BASE, base);
  url.searchParams.set("s", query);
  url.searchParams.set("type", "movie");
  if (OMDB_API_KEY.trim().length > 0) {
    url.searchParams.set("apikey", OMDB_API_KEY);
  }

  try {
    const response = await fetch(url.toString(), {
      signal,
      headers: { Accept: "application/json" },
    });

    const json = await response.json();

    if (!response.ok) {
      if (
        response.status === 401 ||
        (json &&
          typeof json === "object" &&
          "code" in json &&
          json.code === "omdb_auth")
      ) {
        throw new Error("OMDb key was rejected");
      }
      throw new Error(`OMDb search failed with status ${response.status}`);
    }

    const data = OmdbSearchResultSchema.parse(json);

    if (!data.Search) {
      return [];
    }

    const withTitles = data.Search.filter(
      (movie) => sanitizeInput(movie.Title).length > 0,
    );

    return withTitles.slice(0, 6).map(
      (movie): MovieAutocompleteResult => ({
        title: sanitizeInput(movie.Title),
        year: movie.Year,
        imdbID: movie.imdbID,
        type: movie.Type as "movie" | "series",
        poster: normalizePosterUrl(movie.Poster),
      }),
    );
  } catch (error) {
    throw new Error(
      `OMDb search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      { cause: error },
    );
  }
};

export const fetchOmdbMetadata = async (
  title: string,
  type?: "movie" | "series",
  imdbId?: string,
  signal?: AbortSignal,
): Promise<MovieMetadata> => {
  const base =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(OMDB_BASE, base);
  if (OMDB_API_KEY.trim().length > 0) {
    url.searchParams.set("apikey", OMDB_API_KEY);
  }
  if (imdbId) {
    url.searchParams.set("i", imdbId);
  } else {
    url.searchParams.set("t", title);
  }
  if (type) {
    url.searchParams.set("type", type);
  }

  try {
    const response = await fetch(url.toString(), {
      signal,
      headers: { Accept: "application/json" },
    });

    const json = await response.json();

    if (!response.ok) {
      if (
        response.status === 401 ||
        (json &&
          typeof json === "object" &&
          "code" in json &&
          json.code === "omdb_auth")
      ) {
        throw new Error("OMDb key was rejected");
      }
      throw new Error(
        `OMDb metadata fetch failed with status ${response.status}`,
      );
    }

    const data = OmdbMetadataSchema.parse(json);
    const requestedTitle = sanitizeInput(title);
    const resolvedTitle = sanitizeInput(data.Title) || requestedTitle;

    return {
      title: resolvedTitle,
      year: data.Year,
      imdbID: data.imdbID,
      imdbRating:
        data.imdbRating && data.imdbRating !== "N/A"
          ? data.imdbRating
          : undefined,
      type: (data.Type?.toLowerCase() as "movie" | "series") || "movie",
      poster: normalizePosterUrl(data.Poster),
      plot: stripHtml(data.Plot),
      director: data.Director,
      actors: data.Actors?.split(", ").map((actor: string) =>
        sanitizeInput(actor.trim()),
      ),
      genre: data.Genre?.split(", ").map((genre: string) =>
        sanitizeInput(genre.trim()),
      ),
      runtime: data.Runtime,
      rated: data.Rated,
      released: data.Released,
    };
  } catch (error) {
    throw new Error(
      `OMDb metadata fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      { cause: error },
    );
  }
};

export { fetchOmdbMetadata as fetchMovieMetadata };

// TVMaze Service

interface TvMazeShow {
  id: number;
  name: string;
  premiered?: string;
  image?: { medium?: string; original?: string };
}

interface TvMazeSearchEntry {
  score: number;
  show: TvMazeShow;
}

export const searchTvMazeShows = async (
  query: string,
  signal?: AbortSignal,
): Promise<MovieAutocompleteResult[]> => {
  const base =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(TVMAZE_BASE, base);
  url.searchParams.set("mode", "search");
  url.searchParams.set("q", query);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      METADATA_REQUEST_TIMEOUT_MS,
    );
    const mergedSignal =
      signal && typeof AbortSignal.any === "function"
        ? AbortSignal.any([signal, controller.signal])
        : (signal ?? controller.signal);

    const response = await fetch(url.toString(), {
      signal: mergedSignal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`TVMaze search failed with status ${response.status}`);
    }

    const data = (await response.json()) as TvMazeSearchEntry[];

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((entry) => ({
      title: entry.show.name || "",
      year: entry.show.premiered?.split("-")[0],
      imdbID: `tv-${entry.show.id}`,
      type: "series" as const,
      poster: normalizePosterUrl(
        entry.show.image?.medium || entry.show.image?.original,
      ),
    }));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    throw new Error(
      `TVMaze search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      { cause: error },
    );
  }
};

// OMDb Metadata Cache

const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  promise: Promise<MovieMetadata>;
  timestamp: number;
}

const metadataCache = new Map<string, CacheEntry>();

const buildCacheKey = (
  title: string,
  type?: string,
  imdbID?: string,
): string => `${imdbID ?? title.trim().toLowerCase()}::${type ?? "movie"}`;

const evictOldest = () => {
  while (metadataCache.size > MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of metadataCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (!oldestKey) break;
    metadataCache.delete(oldestKey);
  }
};

export const fetchOmdbMetadataCached = (
  title: string,
  type?: "movie" | "series",
  imdbID?: string,
  signal?: AbortSignal,
): Promise<MovieMetadata> => {
  const key = buildCacheKey(title, type, imdbID);
  const now = Date.now();
  const cached = metadataCache.get(key);

  if (cached) {
    if (now - cached.timestamp < CACHE_TTL_MS) {
      cached.timestamp = now;
      return cached.promise;
    }
    metadataCache.delete(key);
  }

  const request = fetchOmdbMetadata(title, type, imdbID, signal).catch(
    (error) => {
      metadataCache.delete(key);
      throw error;
    },
  );

  metadataCache.set(key, {
    promise: request,
    timestamp: now,
  });

  evictOldest();

  return request;
};

export const _clearCache = () => {
  metadataCache.clear();
};

// Metadata Aggregator / Autocomplete Service

const getMovieAutocompleteResultKey = (
  result: MovieAutocompleteResult,
): string =>
  `${sanitizeInput(result.title).toLowerCase()}|${sanitizeInput(result.year || "").toLowerCase()}|${result.type}`;

export const mergeMovieAutocompleteResults = (
  movieResults: MovieAutocompleteResult[],
  seriesResults: MovieAutocompleteResult[],
  query?: string,
): MovieAutocompleteResult[] => {
  const normalizedQuery = (query || "").trim().toLowerCase();

  const getScore = (item: MovieAutocompleteResult): number => {
    if (!normalizedQuery) return 0;
    const norm = item.title.toLowerCase();
    if (norm === normalizedQuery) return 2;
    if (norm.startsWith(normalizedQuery)) return 1;
    return 0;
  };

  const uniqueScoredResults: {
    item: MovieAutocompleteResult;
    score: number;
  }[] = [];
  const seen = new Set<string>();

  const maxLen = Math.max(movieResults.length, seriesResults.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < movieResults.length) {
      const item = movieResults[i];
      const key = getMovieAutocompleteResultKey(item);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueScoredResults.push({ item, score: getScore(item) });
      }
    }
    if (i < seriesResults.length) {
      const item = seriesResults[i];
      const key = getMovieAutocompleteResultKey(item);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueScoredResults.push({ item, score: getScore(item) });
      }
    }
  }

  return uniqueScoredResults
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return 0;
    })
    .map((entry) => entry.item)
    .slice(0, MOVIE_AUTOCOMPLETE_RESULT_LIMIT);
};

export const searchMovieAutocomplete = async (
  query: string,
  options: { signal?: AbortSignal } = {},
): Promise<MovieAutocompleteResult[]> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const [omdbResults, tvMazeResults] = await Promise.allSettled([
    searchOmdbMovies(trimmedQuery, options.signal),
    searchTvMazeShows(trimmedQuery, options.signal),
  ]);

  if (
    omdbResults.status === "rejected" &&
    tvMazeResults.status === "rejected"
  ) {
    throw omdbResults.reason;
  }

  const successfulOmdbResults =
    omdbResults.status === "fulfilled" ? omdbResults.value : [];
  const successfulTvMazeResults =
    tvMazeResults.status === "fulfilled" ? tvMazeResults.value : [];

  const omdbLimited = successfulOmdbResults.slice(
    0,
    MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT,
  );
  const tvMazeLimited = successfulTvMazeResults.slice(
    0,
    MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT,
  );

  return mergeMovieAutocompleteResults(omdbLimited, tvMazeLimited, query);
};
