import { isValidUrl, sanitizeInput } from '../../utils/shared';
import { OMDB_BASE, OMDB_API_KEY, METADATA_REQUEST_TIMEOUT_MS } from './config';
import type { MovieAutocompleteResult, OmdbSearchResult, MovieMetadata } from './types';

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

    const data = await response.json() as OmdbSearchResult;
    
    if (!data.Search) {
      return [];
    }

    return data.Search.slice(0, 6).map((movie): MovieAutocompleteResult => ({
      title: sanitizeInput(movie.Title),
      year: movie.Year,
      imdbID: movie.imdbID,
      type: movie.Type.toLowerCase() as 'movie' | 'series',
      poster: normalizePosterUrl(movie.Poster),
    }));
  } catch (error) {
    throw new Error(`OMDb search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const identifier = imdbId || title;
  const searchUrl = `${OMDB_BASE}?t=${encodeURIComponent(identifier)}&apikey=${OMDB_API_KEY}${type ? `&type=${type}` : ''}`;
  
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

    const data = await response.json();
    
    return {
      title: sanitizeInput(data.Title),
      year: data.Year,
      imdbID: data.imdbID,
      type: data.Type?.toLowerCase() as 'movie' | 'series',
      poster: normalizePosterUrl(data.Poster),
      plot: stripHtml(data.Plot),
      director: data.Director,
      actors: data.Actors?.split(', ').map(actor => sanitizeInput(actor.trim())),
      genre: data.Genre?.split(', ').map(genre => sanitizeInput(genre.trim())),
      runtime: data.Runtime,
      rated: data.Rated,
      released: data.Released,
    };
  } catch (error) {
    throw new Error(`OMDb metadata fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
