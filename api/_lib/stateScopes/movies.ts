import { normalizeMovieRecord } from '../../../apps/web/src/services/content/index.js';
import { mockMovies } from '../../../apps/web/src/services/state/index.ts';
import type { StateScopeDataMap } from '../../../apps/web/src/services/state/index.ts';
import type { Movie, User } from '../../../apps/web/src/shared/types.js';
import {
  findMovieByNormalizedTitle,
  isValidUrl,
  MAX_MOVIE_TITLE_LENGTH,
  parseJsonContent,
  sanitizeInput,
} from '../common.js';
import type { MutationContext, ScopeDefinition } from '../state.js';
import { randomUUID } from 'node:crypto';

const extractString = (value: unknown): string =>
  typeof value === 'string' ? sanitizeInput(value) : '';

export const parseMovies = (content: string | null): Movie[] => {
  if (!content) {
    return mockMovies;
  }

  try {
    const parsed = parseJsonContent(content, 'movies');
    if (!Array.isArray(parsed)) {
      console.warn('movies was not an array; defaulting to seed state.');
      return mockMovies;
    }

    return parsed.flatMap((entry) => {
      const next = normalizeMovieRecord(entry);
      return next ? [next] : [];
    });
  } catch (error) {
    console.error('Failed to parse movies; defaulting to seed state.', error);
    return mockMovies;
  }
};

export const sanitizeMovieMetadata = (value: unknown): Partial<Movie> => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const metadata = value as Partial<Movie>;
  const next: Partial<Movie> = {};

  const assignString = (
    key: keyof Pick<
      Movie,
      'year' | 'plot' | 'imdbRating' | 'runtime' | 'genre' | 'director'
    >,
    nextValue: unknown
  ) => {
    if (typeof nextValue === 'string') {
      const normalized = sanitizeInput(nextValue);
      if (normalized) {
        next[key] = normalized;
      }
    }
  };

  assignString('year', metadata.year);
  assignString('plot', metadata.plot);
  assignString('imdbRating', metadata.imdbRating);
  assignString('runtime', metadata.runtime);
  assignString('genre', metadata.genre);
  assignString('director', metadata.director);

  if (typeof metadata.posterUrl === 'string') {
    const normalized = sanitizeInput(metadata.posterUrl);
    if (normalized && isValidUrl(normalized)) {
      next.posterUrl = normalized;
    }
  }

  if (metadata.mediaType === 'movie' || metadata.mediaType === 'series') {
    next.mediaType = metadata.mediaType;
  }

  if (typeof metadata.category === 'string') {
    const normalized = sanitizeInput(metadata.category);
    if (normalized) {
      next.category = normalized;
    }
  } else if (next.mediaType === 'series') {
    next.category = 'TV Series';
  }

  return next;
};

const MAX_MOVIE_BATCH_SIZE = 25;

export const createMovieFromPayload = (
  value: unknown,
  context: MutationContext,
): Movie | null => {
  if (!value || typeof value !== 'object' || !context.currentUser) {
    return null;
  }

  const payload = value as {
    id?: unknown;
    title?: unknown;
    metadata?: unknown;
  };
  const id = extractString(payload.id) || randomUUID();
  const title = extractString(payload.title);
  if (!title || title.length > MAX_MOVIE_TITLE_LENGTH) {
    return null;
  }

  return {
    id,
    title,
    addedBy: context.currentUser,
    watchedBy: [],
    createdAt: context.now,
    ...sanitizeMovieMetadata(payload.metadata),
  };
};

export const movieScopeDefinition: ScopeDefinition<'movies', unknown> = {
  filename: 'movielist.json',
  parse: parseMovies,
  serialize: (value) => JSON.stringify(value, null, 2),
  toClient: (value) => value as StateScopeDataMap['movies'],
  mutate: (current, op, payload, context) => {
    const movies = current as Movie[];

    switch (op) {
      case 'add_movie': {
        const movie = createMovieFromPayload(payload, context);
        if (!movie || !(payload as { id?: unknown }).id) {
          return { ok: false, conflict: 'Invalid movie payload.' };
        }

        if (movies.some((entry) => entry.id === movie.id)) {
          return { ok: false, conflict: 'Movie already exists.' };
        }

        if (findMovieByNormalizedTitle(movies, movie.title)) {
          return {
            ok: false,
            conflict: 'A movie with this title is already in the queue.',
          };
        }

        return {
          ok: true,
          data: [...movies, movie],
        };
      }
      case 'add_movies': {
        const items = (payload as { items?: unknown })?.items;
        if (
          !Array.isArray(items) ||
          items.length === 0 ||
          items.length > MAX_MOVIE_BATCH_SIZE
        ) {
          return {
            ok: false,
            conflict: `Movie batches must contain 1-${MAX_MOVIE_BATCH_SIZE} items.`,
          };
        }

        const parsed = items.map((item) => createMovieFromPayload(item, context));
        if (parsed.some((movie) => movie === null)) {
          return { ok: false, conflict: 'Invalid movie batch payload.' };
        }

        const next = [...movies];
        const knownIds = new Set(movies.map((movie) => movie.id));
        for (const movie of parsed as Movie[]) {
          if (knownIds.has(movie.id)) {
            return { ok: false, conflict: 'Movie already exists.' };
          }
          if (findMovieByNormalizedTitle(next, movie.title)) {
            continue;
          }
          knownIds.add(movie.id);
          next.push(movie);
        }

        return { ok: true, data: next };
      }
      case 'rename_movie': {
        const nextPayload = payload as {
          movieId?: unknown;
          title?: unknown;
        };
        const movieId = extractString(nextPayload.movieId);
        const title = extractString(nextPayload.title);

        if (!movieId || !title || title.length > MAX_MOVIE_TITLE_LENGTH) {
          return { ok: false, conflict: 'Invalid movie title.' };
        }

        if (!movies.some((movie) => movie.id === movieId)) {
          return { ok: false, conflict: 'Movie not found.' };
        }

        return {
          ok: true,
          data: movies.map((movie) =>
            movie.id === movieId
              ? {
                  ...movie,
                  title,
                }
              : movie
          ),
        };
      }
      case 'toggle_watched': {
        const movieId = extractString((payload as { movieId?: unknown }).movieId);

        const target = movies.find((movie) => movie.id === movieId);
        if (!target) {
          return { ok: false, conflict: 'Movie not found.' };
        }

        return {
          ok: true,
          data: movies.map((movie) => {
            if (movie.id !== movieId) {
              return movie;
            }

            const watchedBy = movie.watchedBy.includes(context.currentUser!)
              ? movie.watchedBy.filter((user: User) => user !== context.currentUser!)
              : [...movie.watchedBy, context.currentUser!];

            return {
              ...movie,
              watchedBy,
            };
          }),
        };
      }
      case 'delete_movie': {
        const movieId = extractString((payload as { movieId?: unknown }).movieId);

        if (!movies.some((movie) => movie.id === movieId)) {
          return { ok: false, conflict: 'Movie not found.' };
        }

        return {
          ok: true,
          data: movies.filter((movie) => movie.id !== movieId),
        };
      }
      case 'restore_movie': {
        const restored = normalizeMovieRecord(
          (payload as { movie?: unknown }).movie
        );

        if (!restored) {
          return { ok: false, conflict: 'Invalid movie restore payload.' };
        }

        if (movies.some((movie) => movie.id === restored.id)) {
          return { ok: false, conflict: 'Movie already exists.' };
        }

        return {
          ok: true,
          data: [...movies, restored],
        };
      }
      case 'update_metadata': {
        const nextPayload = payload as {
          movieId?: unknown;
          metadata?: unknown;
        };
        const movieId = extractString(nextPayload.movieId);
        const metadata = sanitizeMovieMetadata(nextPayload.metadata);

        if (!movieId || Object.keys(metadata).length === 0) {
          return { ok: false, conflict: 'Invalid metadata payload.' };
        }

        if (!movies.some((movie) => movie.id === movieId)) {
          return { ok: false, conflict: 'Movie not found.' };
        }

        return {
          ok: true,
          data: movies.map((movie) =>
            movie.id === movieId
              ? {
                  ...movie,
                  ...metadata,
                }
              : movie
          ),
        };
      }
      default:
        return { ok: false, conflict: `Unsupported movies operation: ${op}` };
    }
  },
};
