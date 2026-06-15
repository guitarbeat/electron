import { z } from 'zod';
import { isValidUrl, sanitizeInput } from '../../utils/shared.ts';
import { OMDB_BASE, OMDB_API_KEY } from './config.ts';
import type { MovieAutocompleteResult, MovieMetadata } from './types.ts';

const omdbTitleField = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .optional()
  .transform((v) => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    return '';
  });

const OmdbMovieSchema = z.object({
  Title: omdbTitleField,
  Year: z.string().optional(),
  imdbID: z.string().optional(),
  Type: z.enum(['movie', 'series']).catch('movie' as never),
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
  return value.replace(/<[^>]*>?/gm, '');
};

export const normalizePosterUrl = (value?: string | null): string | undefined => {
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

export const searchOmdbMovies = async (
  query: string,
  signal?: AbortSignal
): Promise<MovieAutocompleteResult[]> => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL(OMDB_BASE, base);
  url.searchParams.set('s', query);
  url.searchParams.set('type', 'movie');
  if (OMDB_API_KEY.trim().length > 0) {
    url.searchParams.set('apikey', OMDB_API_KEY);
  }
  
  try {
    const response = await fetch(url.toString(), { 
      signal,
      headers: { 'Accept': 'application/json' }
    });

    const json = await response.json();

    if (!response.ok) {
      if (response.status === 401 || (json && typeof json === 'object' && 'code' in json && json.code === 'omdb_auth')) {
        throw new Error('OMDb key was rejected');
      }
      throw new Error(`OMDb search failed with status ${response.status}`);
    }

    const data = OmdbSearchResultSchema.parse(json);

    if (!data.Search) {
      return [];
    }

    const withTitles = data.Search.filter((movie) => sanitizeInput(movie.Title).length > 0);

    return withTitles.slice(0, 6).map((movie): MovieAutocompleteResult => ({
      title: sanitizeInput(movie.Title),
      year: movie.Year,
      imdbID: movie.imdbID,
      type: movie.Type as 'movie' | 'series',
      poster: normalizePosterUrl(movie.Poster),
    }));
  } catch (error) {
    throw new Error(`OMDb search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error });
  }
};

export const fetchOmdbMetadata = async (
  title: string,
  type?: 'movie' | 'series',
  imdbId?: string,
  signal?: AbortSignal
): Promise<MovieMetadata> => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL(OMDB_BASE, base);
  if (OMDB_API_KEY.trim().length > 0) {
    url.searchParams.set('apikey', OMDB_API_KEY);
  }
  if (imdbId) {
    url.searchParams.set('i', imdbId);
  } else {
    url.searchParams.set('t', title);
  }
  if (type) {
    url.searchParams.set('type', type);
  }
  
  try {
    const response = await fetch(url.toString(), { 
      signal,
      headers: { 'Accept': 'application/json' }
    });

    const json = await response.json();

    if (!response.ok) {
      if (response.status === 401 || (json && typeof json === 'object' && 'code' in json && json.code === 'omdb_auth')) {
        throw new Error('OMDb key was rejected');
      }
      throw new Error(`OMDb metadata fetch failed with status ${response.status}`);
    }

    const data = OmdbMetadataSchema.parse(json);
    const requestedTitle = sanitizeInput(title);
    const resolvedTitle = sanitizeInput(data.Title) || requestedTitle;

    return {
      title: resolvedTitle,
      year: data.Year,
      imdbID: data.imdbID,
      imdbRating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : undefined,
      type: (data.Type?.toLowerCase() as 'movie' | 'series') || 'movie',
      poster: normalizePosterUrl(data.Poster),
      plot: stripHtml(data.Plot),
      director: data.Director,
      actors: data.Actors?.split(', ').map((actor: string) => sanitizeInput(actor.trim())),
      genre: data.Genre?.split(', ').map((genre: string) => sanitizeInput(genre.trim())),
      runtime: data.Runtime,
      rated: data.Rated,
      released: data.Released,
    };
  } catch (error) {
    throw new Error(`OMDb metadata fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error });
  }
};

export { fetchOmdbMetadata as fetchMovieMetadata };
