import type { Movie } from '../../shared/types.ts';
import { isUser, isValidUrl, sanitizeInput } from '../../utils/shared.ts';

const normalizeRequiredString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = sanitizeInput(value);
  return normalized || null;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = sanitizeInput(value);
  return normalized || undefined;
};

const normalizeCreatedAt = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  return Number.isNaN(Date.parse(value)) ? null : value;
};

const normalizePosterUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = sanitizeInput(value);
  if (!normalized || !isValidUrl(normalized)) {
    return undefined;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
};

export const cloneMovies = (movies: Movie[]): Movie[] =>
  movies.map((movie) => ({
    ...movie,
    watchedBy: [...movie.watchedBy],
  }));

export const normalizeMovieRecord = (value: unknown): Movie | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const movie = value as Partial<Movie>;
  const id = normalizeRequiredString(movie.id);
  const title = normalizeRequiredString(movie.title);
  const createdAt = normalizeCreatedAt(movie.createdAt);

  if (!id || !title || !isUser(movie.addedBy) || !createdAt) {
    return null;
  }

  const watchedBy = Array.isArray(movie.watchedBy)
    ? [...new Set(movie.watchedBy.filter(isUser))]
    : [];

  return {
    id,
    title,
    addedBy: movie.addedBy,
    watchedBy,
    createdAt,
    posterUrl: normalizePosterUrl(movie.posterUrl),
    year: normalizeOptionalString(movie.year),
    plot: normalizeOptionalString(movie.plot),
    imdbRating: normalizeOptionalString(movie.imdbRating),
    runtime: normalizeOptionalString(movie.runtime),
    genre: normalizeOptionalString(movie.genre),
    director: normalizeOptionalString(movie.director),
    category: normalizeOptionalString(movie.category),
  };
};

export const isMovieRecord = (value: unknown): value is Movie =>
  normalizeMovieRecord(value) !== null;

export const normalizeMovies = (value: unknown): Movie[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const normalizedMovie = normalizeMovieRecord(entry);
        return normalizedMovie ? [normalizedMovie] : [];
      })
    : [];
