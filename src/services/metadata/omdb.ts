import { z } from 'zod';
import { isValidUrl, sanitizeInput } from '../../utils/shared';
import { OMDB_BASE, OMDB_API_KEY } from './config';
import type { MovieAutocompleteResult, OmdbSearchResult, MovieMetadata } from './types';

const OmdbMovieSchema = z.object({
  Title: z.string(),
  Year: z.string().optional(),
  imdbID: z.string().optional(),
  Type: z.enum(['movie', 'series']).catch('movie' as never),
  Poster: z.string().optional(),
});

const OmdbSearchResultSchema = z.object({
  Search: z.array(OmdbMovieSchema).optional(),
});

const OmdbMetadataSchema = z.object({
  Title: z.string(),
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

export const searchOmdbMovies = async (
  query: string,
  signal?: AbortSignal
): Promise<MovieAutocompleteResult[]> => {
  if (!OMDB_API_KEY) {
    throw new Error('OMDb API key not configured');
  }

  const searchUrl = `${OMDB_BASE}?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`;
  
  try {
    const response = await fetch(searchUrl, { 
      signal,
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('OMDb API key rejected');
      }
      throw new Error(`OMDb search failed with status ${response.status}`);
    }

    const json = await response.json();
    const data = OmdbSearchResultSchema.parse(json);
    
    if (!data.Search) {
      return [];
    }

    return data.Search.slice(0, 6).map((movie): MovieAutocompleteResult => ({
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
  if (!OMDB_API_KEY) {
    throw new Error('OMDb API key not configured');
  }

  const searchUrl = imdbId
    ? `${OMDB_BASE}?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}${type ? `&type=${type}` : ''}`
    : `${OMDB_BASE}?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}${type ? `&type=${type}` : ''}`;
  
  try {
    const response = await fetch(searchUrl, { 
      signal,
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('OMDb API key rejected');
      }
      throw new Error(`OMDb metadata fetch failed with status ${response.status}`);
    }

    const json = await response.json();
    const data = OmdbMetadataSchema.parse(json);
    
    return {
      title: sanitizeInput(data.Title),
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
