import type { Movie } from '../types.ts';
import { isUser, isValidUrl, sanitizeInput } from '../utils';

/**
 * Consolidated Data Helpers
 * Combines PIN normalization utilities and Movie record normalization.
 */

// ============================================================================
// PIN Helpers (formerly pinHelpers.ts)
// ============================================================================

export interface UserPins {
  Aaron?: string;
  Electra?: string;
}

type SerialTaskRunner = <T>(task: () => Promise<T>) => Promise<T>;

const normalizeOptionalPinHash = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
};

export const clonePins = (pins: UserPins): UserPins => ({ ...pins });

export const normalizeUserPins = (value: unknown): UserPins | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const pins = value as Partial<UserPins>;

  return {
    Aaron: normalizeOptionalPinHash(pins.Aaron),
    Electra: normalizeOptionalPinHash(pins.Electra),
  };
};

export const isUserPinsRecord = (value: unknown): value is UserPins =>
  normalizeUserPins(value) !== null;

export const parsePinsContent = (fileContent: string | undefined): UserPins => {
  if (!fileContent) {
    return {};
  }

  try {
    const parsed = JSON.parse(fileContent);
    return normalizeUserPins(parsed) ?? {};
  } catch (parseError) {
    console.error('Error parsing PIN file:', parseError);
    return {};
  }
};

export const createSerialTaskRunner = (): SerialTaskRunner => {
  let pendingTask = Promise.resolve();

  return async <T>(task: () => Promise<T>): Promise<T> => {
    const nextTask = pendingTask.then(task, task);
    pendingTask = nextTask.then(
      () => undefined,
      () => undefined
    );
    return nextTask;
  };
};

// ============================================================================
// Movie Record Helpers (formerly movieRecords.ts)
// ============================================================================

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

export const normalizeMovies = (value: unknown[]): Movie[] =>
  value.flatMap((entry) => {
    const normalizedMovie = normalizeMovieRecord(entry);
    return normalizedMovie ? [normalizedMovie] : [];
  });
