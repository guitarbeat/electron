import { createHash, randomUUID } from 'node:crypto';

import {
  appendSpinHistory,
  SPIN_HISTORY_MAX,
} from '../../src/components/spinWheel/spinWheelEngine.ts';
import {
  applyMatchmakerSwipe,
  undoMatchmakerSwipe,
} from '../../src/components/matchmaker/matchmakerGame.ts';
import {
  normalizeMovieRecord,
  normalizeMovies,
} from '../../src/services/movieRecords.ts';
import { type UserPins } from '../../src/services/pinHelpers.ts';
import {
  appendDailySpinEntry,
  cloneQuizData,
  defaultQuizData,
  normalizeMatchmakerGame,
  normalizeMessageRecord,
  normalizePlaceRecord,
  normalizeQuizData,
  normalizeSharedMemoryRecord,
  normalizeDailySpinRecord,
  normalizeSpinHistoryParsed,
  normalizeStoredPins,
  normalizeSuggestionRecord,
} from '../../src/services/stateSchemas.ts';
import type {
  DailySpinRecord,
  MutationRequest,
  StateScope,
  StateScopeDataMap,
} from '../../src/services/stateTypes.ts';
import type {
  MatchmakerGame,
  Message,
  Movie,
  MovieSuggestion,
  Place,
  SharedMemory,
  User,
} from '../../src/shared/types.ts';
import {
  MAX_MESSAGE_LENGTH,
  MAX_MOVIE_TITLE_LENGTH,
  isValidUrl,
  parseJsonContent,
  sanitizeInput,
} from '../../src/utils/shared.ts';
import {
  badRequestResponse,
  conflictResponse,
  jsonResponse,
  methodNotAllowedResponse,
  normalizeEtag,
  serverErrorResponse,
  toQuotedEtag,
  unauthorizedResponse,
} from './http.ts';
import { patchGistFile, readGistFile } from './gistStore.ts';
import { hashPin, requireProfileUser, hasAccessSession, verifyStoredPin } from './session.ts';

interface MutationContext {
  currentUser: User;
  now: string;
}

type MutationFailure = {
  ok: false;
  conflict: string;
};

type MutationSuccess<T> = {
  ok: true;
  data: T;
};

type MutationResult<T> = MutationFailure | MutationSuccess<T>;

interface ScopeDefinition<
  TScope extends StateScope,
  TStored,
  TClient = StateScopeDataMap[TScope]
> {
  filename: string;
  parse: (content: string | null) => TStored;
  serialize: (value: TStored) => string;
  toClient: (value: TStored) => TClient;
  strictVersion?: boolean;
  mutate?: (
    current: TStored,
    op: string,
    payload: unknown,
    context: MutationContext
  ) => MutationResult<TStored>;
}

const parseArrayScope = <T>(
  content: string | null,
  context: string,
  normalizeRecord: (value: unknown) => T | null
): T[] => {
  if (!content) {
    return [];
  }

  try {
    const parsed = parseJsonContent(content, context);
    if (!Array.isArray(parsed)) {
      console.warn(`${context} was not an array; defaulting to empty state.`);
      return [];
    }

    const normalized = parsed.flatMap((entry) => {
      const next = normalizeRecord(entry);
      return next ? [next] : [];
    });

    if (normalized.length !== parsed.length) {
      console.warn(
        `Dropped ${parsed.length - normalized.length} invalid record(s) from ${context}.`
      );
    }

    return normalized;
  } catch (error) {
    console.error(`Failed to parse ${context}; defaulting to empty state.`, error);
    return [];
  }
};

const parseMovies = (content: string | null): Movie[] => {
  if (!content) {
    return [];
  }

  try {
    const parsed = parseJsonContent(content, 'movies');
    if (!Array.isArray(parsed)) {
      console.warn('movies.json was not an array; defaulting to empty state.');
      return [];
    }

    const normalized = normalizeMovies(parsed);
    if (normalized.length !== parsed.length) {
      console.warn(
        `Dropped ${parsed.length - normalized.length} invalid movie record(s) from movies.json.`
      );
    }
    return normalized;
  } catch (error) {
    console.error('Failed to parse movies.json; defaulting to empty state.', error);
    return [];
  }
};

const parseQuiz = (content: string | null) => {
  if (!content) {
    return cloneQuizData(defaultQuizData);
  }

  try {
    const parsed = parseJsonContent(content, 'quiz');
    return normalizeQuizData(parsed) ?? cloneQuizData(defaultQuizData);
  } catch (error) {
    console.error('Failed to parse quiz.json; using defaults.', error);
    return cloneQuizData(defaultQuizData);
  }
};

const parseMatchmaker = (content: string | null): MatchmakerGame | null => {
  if (!content) {
    return null;
  }

  try {
    return normalizeMatchmakerGame(parseJsonContent(content, 'matchmaker'));
  } catch (error) {
    console.error('Failed to parse matchmaker.json; defaulting to no game.', error);
    return null;
  }
};

const parsePins = (content: string | null): UserPins => {
  if (!content) {
    return {};
  }

  try {
    return normalizeStoredPins(parseJsonContent(content, 'pins'));
  } catch (error) {
    console.error('Failed to parse pins.json; defaulting to empty pins.', error);
    return {};
  }
};

const parseSpinHistory = (content: string | null): string[] => {
  if (!content) {
    return [];
  }

  try {
    const parsed = parseJsonContent(content, 'spinHistory');
    return normalizeSpinHistoryParsed(parsed);
  } catch (error) {
    console.error('Failed to parse spinhistory.json; defaulting to empty history.', error);
    return [];
  }
};

const parseDailySpin = (content: string | null): DailySpinRecord | null => {
  if (!content) {
    return null;
  }

  try {
    const parsed = parseJsonContent(content, 'dailySpin');
    return normalizeDailySpinRecord(parsed);
  } catch (error) {
    console.error('Failed to parse dailyspin.json; defaulting to no daily spin.', error);
    return null;
  }
};

const computeVersion = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

const sanitizeMovieMetadata = (value: unknown): Partial<Movie> => {
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

  return next;
};

const ensureFourDigitPin = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\D/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
};

const ensureBoolean = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

const scopes: {
  [K in StateScope]: ScopeDefinition<K, unknown>;
} = {
  movies: {
    filename: 'movielist.json',
    parse: parseMovies,
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => value as StateScopeDataMap['movies'],
    mutate: (current, op, payload, context) => {
      const movies = current as Movie[];

      switch (op) {
        case 'add_movie': {
          const nextPayload = payload as { id?: unknown; title?: unknown };
          const id = typeof nextPayload.id === 'string' ? sanitizeInput(nextPayload.id) : '';
          const title =
            typeof nextPayload.title === 'string'
              ? sanitizeInput(nextPayload.title)
              : '';

          if (!id || !title || title.length > MAX_MOVIE_TITLE_LENGTH) {
            return { ok: false, conflict: 'Invalid movie payload.' };
          }

          if (movies.some((movie) => movie.id === id)) {
            return { ok: false, conflict: 'Movie already exists.' };
          }

          return {
            ok: true,
            data: [
              ...movies,
              {
                id,
                title,
                addedBy: context.currentUser,
                watchedBy: [],
                createdAt: context.now,
              },
            ],
          };
        }
        case 'toggle_watched': {
          const movieId =
            typeof (payload as { movieId?: unknown }).movieId === 'string'
              ? sanitizeInput((payload as { movieId?: string }).movieId || '')
              : '';

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

              const watchedBy = movie.watchedBy.includes(context.currentUser)
                ? movie.watchedBy.filter((user: User) => user !== context.currentUser)
                : [...movie.watchedBy, context.currentUser];

              return {
                ...movie,
                watchedBy,
              };
            }),
          };
        }
        case 'delete_movie': {
          const movieId =
            typeof (payload as { movieId?: unknown }).movieId === 'string'
              ? sanitizeInput((payload as { movieId?: string }).movieId || '')
              : '';

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
          const movieId =
            typeof nextPayload.movieId === 'string'
              ? sanitizeInput(nextPayload.movieId)
              : '';
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
  },
  messages: {
    filename: 'messages.json',
    parse: (content) =>
      parseArrayScope<Message>(content, 'messages', normalizeMessageRecord),
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => value as StateScopeDataMap['messages'],
    mutate: (current, op, payload, context) => {
      const messages = current as Message[];

      switch (op) {
        case 'add_message': {
          const nextPayload = payload as { id?: unknown; content?: unknown };
          const id =
            typeof nextPayload.id === 'string' && sanitizeInput(nextPayload.id)
              ? sanitizeInput(nextPayload.id)
              : `message-${randomUUID()}`;
          const content =
            typeof nextPayload.content === 'string'
              ? sanitizeInput(nextPayload.content || '')
              : '';

          if (!content || content.length > MAX_MESSAGE_LENGTH) {
            return { ok: false, conflict: 'Invalid message content.' };
          }

          if (messages.some((message) => message.id === id)) {
            return { ok: false, conflict: 'Message already exists.' };
          }

          return {
            ok: true,
            data: [
              ...messages,
              {
                id,
                author: context.currentUser,
                content,
                createdAt: context.now,
              },
            ],
          };
        }
        case 'delete_message': {
          const messageId =
            typeof (payload as { messageId?: unknown }).messageId === 'string'
              ? sanitizeInput((payload as { messageId?: string }).messageId || '')
              : '';

          const message = messages.find((entry) => entry.id === messageId);
          if (!message) {
            return { ok: false, conflict: 'Message not found.' };
          }

          if (message.author !== context.currentUser) {
            return { ok: false, conflict: 'Only the author can delete this message.' };
          }

          return {
            ok: true,
            data: messages.filter((entry) => entry.id !== messageId),
          };
        }
        default:
          return { ok: false, conflict: `Unsupported messages operation: ${op}` };
      }
    },
  },
  memories: {
    filename: 'memories.json',
    parse: (content) =>
      parseArrayScope<SharedMemory>(content, 'memories', normalizeSharedMemoryRecord),
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => value as StateScopeDataMap['memories'],
    mutate: (current, op, payload, context) => {
      const memories = current as SharedMemory[];

      switch (op) {
        case 'add_memory': {
          const nextPayload = payload as {
            id?: unknown;
            movieId?: unknown;
            movieTitle?: unknown;
            note?: unknown;
            imageUrl?: unknown;
          };
          const id =
            typeof nextPayload.id === 'string' && sanitizeInput(nextPayload.id)
              ? sanitizeInput(nextPayload.id)
              : `memory-${randomUUID()}`;
          const movieTitle =
            typeof nextPayload.movieTitle === 'string'
              ? sanitizeInput(nextPayload.movieTitle)
              : '';
          const note =
            typeof nextPayload.note === 'string'
              ? sanitizeInput(nextPayload.note)
              : '';

          if (!movieTitle || !note) {
            return { ok: false, conflict: 'Invalid memory payload.' };
          }

          if (memories.some((memory) => memory.id === id)) {
            return { ok: false, conflict: 'Memory already exists.' };
          }

          return {
            ok: true,
            data: [
              {
                id,
                movieId:
                  typeof nextPayload.movieId === 'string'
                    ? sanitizeInput(nextPayload.movieId)
                    : undefined,
                movieTitle,
                author: context.currentUser,
                note,
                createdAt: context.now,
                imageUrl:
                  typeof nextPayload.imageUrl === 'string'
                    ? sanitizeInput(nextPayload.imageUrl)
                    : undefined,
              },
              ...memories,
            ],
          };
        }
        case 'update_memory': {
          const nextPayload = payload as {
            memoryId?: unknown;
            updates?: { note?: unknown; movieId?: unknown; movieTitle?: unknown };
          };
          const memoryId =
            typeof nextPayload.memoryId === 'string'
              ? sanitizeInput(nextPayload.memoryId)
              : '';

          const index = memories.findIndex((memory) => memory.id === memoryId);
          if (index < 0) {
            return { ok: false, conflict: 'Memory not found.' };
          }

          const currentMemory = memories[index];
          const updatedMemory: SharedMemory = {
            ...currentMemory,
            note:
              typeof nextPayload.updates?.note === 'string'
                ? sanitizeInput(nextPayload.updates.note)
                : currentMemory.note,
            movieId:
              typeof nextPayload.updates?.movieId === 'string'
                ? sanitizeInput(nextPayload.updates.movieId)
                : currentMemory.movieId,
            movieTitle:
              typeof nextPayload.updates?.movieTitle === 'string'
                ? sanitizeInput(nextPayload.updates.movieTitle)
                : currentMemory.movieTitle,
            updatedAt: context.now,
          };

          return {
            ok: true,
            data: memories.map((memory) =>
              memory.id === memoryId ? updatedMemory : memory
            ),
          };
        }
        case 'delete_memory': {
          const memoryId =
            typeof (payload as { memoryId?: unknown }).memoryId === 'string'
              ? sanitizeInput((payload as { memoryId?: string }).memoryId || '')
              : '';

          if (!memories.some((memory) => memory.id === memoryId)) {
            return { ok: false, conflict: 'Memory not found.' };
          }

          return {
            ok: true,
            data: memories.filter((memory) => memory.id !== memoryId),
          };
        }
        case 'toggle_memory_pin': {
          const memoryId =
            typeof (payload as { memoryId?: unknown }).memoryId === 'string'
              ? sanitizeInput((payload as { memoryId?: string }).memoryId || '')
              : '';

          const existing = memories.find((memory) => memory.id === memoryId);
          if (!existing) {
            return { ok: false, conflict: 'Memory not found.' };
          }

          return {
            ok: true,
            data: memories.map((memory) =>
              memory.id === memoryId
                ? {
                    ...memory,
                    isPinned: !memory.isPinned,
                    updatedAt: context.now,
                  }
                : memory
            ),
          };
        }
        default:
          return { ok: false, conflict: `Unsupported memories operation: ${op}` };
      }
    },
  },
  places: {
    filename: 'places.json',
    parse: (content) =>
      parseArrayScope<Place>(content, 'places', normalizePlaceRecord),
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => value as StateScopeDataMap['places'],
    mutate: (current, op, payload, context) => {
      const places = current as Place[];

      switch (op) {
        case 'add_place': {
          const nextPayload = payload as {
            id?: unknown;
            name?: unknown;
            notes?: unknown;
            lat?: unknown;
            lng?: unknown;
          };
          const id =
            typeof nextPayload.id === 'string' ? sanitizeInput(nextPayload.id) : '';
          const name =
            typeof nextPayload.name === 'string'
              ? sanitizeInput(nextPayload.name)
              : '';

          if (!id || !name) {
            return { ok: false, conflict: 'Invalid place payload.' };
          }

          if (places.some((place) => place.id === id)) {
            return { ok: false, conflict: 'Place already exists.' };
          }

          return {
            ok: true,
            data: [
              ...places,
              {
                id,
                name,
                addedBy: context.currentUser,
                notes:
                  typeof nextPayload.notes === 'string'
                    ? sanitizeInput(nextPayload.notes)
                    : undefined,
                createdAt: context.now,
                lat:
                  typeof nextPayload.lat === 'number' ? nextPayload.lat : undefined,
                lng:
                  typeof nextPayload.lng === 'number' ? nextPayload.lng : undefined,
              },
            ],
          };
        }
        case 'update_place': {
          const nextPayload = payload as {
            placeId?: unknown;
            updates?: { name?: unknown; notes?: unknown };
          };
          const placeId =
            typeof nextPayload.placeId === 'string'
              ? sanitizeInput(nextPayload.placeId)
              : '';

          const existing = places.find((place) => place.id === placeId);
          if (!existing) {
            return { ok: false, conflict: 'Place not found.' };
          }

          return {
            ok: true,
            data: places.map((place) =>
              place.id === placeId
                ? {
                    ...place,
                    name:
                      typeof nextPayload.updates?.name === 'string'
                        ? sanitizeInput(nextPayload.updates.name)
                        : place.name,
                    notes:
                      typeof nextPayload.updates?.notes === 'string'
                        ? sanitizeInput(nextPayload.updates.notes)
                        : place.notes,
                  }
                : place
            ),
          };
        }
        case 'remove_place': {
          const placeId =
            typeof (payload as { placeId?: unknown }).placeId === 'string'
              ? sanitizeInput((payload as { placeId?: string }).placeId || '')
              : '';

          if (!places.some((place) => place.id === placeId)) {
            return { ok: false, conflict: 'Place not found.' };
          }

          return {
            ok: true,
            data: places.filter((place) => place.id !== placeId),
          };
        }
        case 'mark_visited':
        case 'mark_unvisited': {
          const placeId =
            typeof (payload as { placeId?: unknown }).placeId === 'string'
              ? sanitizeInput((payload as { placeId?: string }).placeId || '')
              : '';

          if (!places.some((place) => place.id === placeId)) {
            return { ok: false, conflict: 'Place not found.' };
          }

          return {
            ok: true,
            data: places.map((place) =>
              place.id === placeId
                ? {
                    ...place,
                    visitedAt: op === 'mark_visited' ? context.now : undefined,
                  }
                : place
            ),
          };
        }
        default:
          return { ok: false, conflict: `Unsupported places operation: ${op}` };
      }
    },
  },
  suggestions: {
    filename: 'suggestions.json',
    parse: (content) =>
      parseArrayScope<MovieSuggestion>(
        content,
        'suggestions',
        normalizeSuggestionRecord
      ),
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => value as StateScopeDataMap['suggestions'],
    mutate: (current, op, payload, context) => {
      const suggestions = current as MovieSuggestion[];

      switch (op) {
        case 'add_suggestion': {
          const nextPayload = payload as {
            id?: unknown;
            title?: unknown;
            reason?: unknown;
          };
          const id =
            typeof nextPayload.id === 'string' ? sanitizeInput(nextPayload.id) : '';
          const title =
            typeof nextPayload.title === 'string'
              ? sanitizeInput(nextPayload.title)
              : '';

          if (!id || !title) {
            return { ok: false, conflict: 'Invalid suggestion payload.' };
          }

          if (suggestions.some((suggestion) => suggestion.id === id)) {
            return { ok: false, conflict: 'Suggestion already exists.' };
          }

          return {
            ok: true,
            data: [
              ...suggestions,
              {
                id,
                title,
                suggestedBy: context.currentUser,
                reason:
                  typeof nextPayload.reason === 'string'
                    ? sanitizeInput(nextPayload.reason)
                    : undefined,
                status: 'pending',
                createdAt: context.now,
              },
            ],
          };
        }
        case 'accept_suggestion':
        case 'reject_suggestion': {
          const suggestionId =
            typeof (payload as { suggestionId?: unknown }).suggestionId === 'string'
              ? sanitizeInput(
                  (payload as { suggestionId?: string }).suggestionId || ''
                )
              : '';

          if (!suggestions.some((suggestion) => suggestion.id === suggestionId)) {
            return { ok: false, conflict: 'Suggestion not found.' };
          }

          return {
            ok: true,
            data: suggestions.map((suggestion) =>
              suggestion.id === suggestionId
                ? {
                    ...suggestion,
                    status: op === 'accept_suggestion' ? 'accepted' : 'rejected',
                    respondedAt: context.now,
                    respondedBy: context.currentUser,
                  }
                : suggestion
            ),
          };
        }
        default:
          return { ok: false, conflict: `Unsupported suggestions operation: ${op}` };
      }
    },
  },
  quiz: {
    filename: 'quiz.json',
    parse: parseQuiz,
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => value as StateScopeDataMap['quiz'],
    strictVersion: true,
    mutate: (_current, op, payload) => {
      if (op !== 'replace_quiz') {
        return { ok: false, conflict: `Unsupported quiz operation: ${op}` };
      }

      const nextPayload = payload as { quizData?: unknown };
      const nextQuiz = normalizeQuizData(nextPayload.quizData ?? payload);
      if (!nextQuiz) {
        return { ok: false, conflict: 'Invalid quiz payload.' };
      }

      return {
        ok: true,
        data: nextQuiz,
      };
    },
  },
  matchmaker: {
    filename: 'matchmaker.json',
    parse: parseMatchmaker,
    serialize: (value) => (value ? JSON.stringify(value, null, 2) : ''),
    toClient: (value) => value as StateScopeDataMap['matchmaker'],
    strictVersion: true,
    mutate: (current, op, payload, context) => {
      const game = current as MatchmakerGame | null;

      switch (op) {
        case 'start_game': {
          const nextPayload = payload as {
            id?: unknown;
            movieIds?: unknown;
          };
          const id =
            typeof nextPayload.id === 'string' && sanitizeInput(nextPayload.id)
              ? sanitizeInput(nextPayload.id)
              : randomUUID();
          const movieIds = Array.isArray(nextPayload.movieIds)
            ? nextPayload.movieIds
                .filter((value): value is string => typeof value === 'string')
                .map((value) => sanitizeInput(value))
                .filter(Boolean)
            : [];

          if (movieIds.length === 0) {
            return { ok: false, conflict: 'A new game requires at least one movie.' };
          }

          return {
            ok: true,
            data: {
              id,
              moviePool: [...new Set(movieIds)],
              aaronLikes: [],
              electraLikes: [],
              aaronDislikes: [],
              electraDislikes: [],
              aaronSwipeOrder: [],
              electraSwipeOrder: [],
              status: 'active',
              createdAt: context.now,
              startedBy: context.currentUser,
            },
          };
        }
        case 'swipe': {
          if (!game) {
            return { ok: false, conflict: 'No active matchmaker game.' };
          }

          const movieId =
            typeof (payload as { movieId?: unknown }).movieId === 'string'
              ? sanitizeInput((payload as { movieId?: string }).movieId || '')
              : '';
          const liked = ensureBoolean((payload as { liked?: unknown }).liked);

          if (!movieId || liked === null) {
            return { ok: false, conflict: 'Invalid swipe payload.' };
          }

          return {
            ok: true,
            data: applyMatchmakerSwipe(game, context.currentUser, movieId, liked),
          };
        }
        case 'undo': {
          if (!game) {
            return { ok: false, conflict: 'No active matchmaker game.' };
          }

          return {
            ok: true,
            data: undoMatchmakerSwipe(game, context.currentUser),
          };
        }
        case 'end_game':
          return {
            ok: true,
            data: null,
          };
        default:
          return { ok: false, conflict: `Unsupported matchmaker operation: ${op}` };
      }
    },
  },
  pins: {
    filename: 'pins.json',
    parse: parsePins,
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => {
      const pins = value as UserPins;
      return {
        Aaron: Boolean(pins.Aaron),
        Electra: Boolean(pins.Electra),
      } satisfies StateScopeDataMap['pins'];
    },
    mutate: (current, op, payload, context) => {
      const pins = current as UserPins;

      switch (op) {
        case 'set_pin': {
          const pin = ensureFourDigitPin((payload as { pin?: unknown }).pin);
          if (!pin) {
            return { ok: false, conflict: 'PIN must be 4 digits.' };
          }

          return {
            ok: true,
            data: {
              ...pins,
              [context.currentUser]: hashPin(pin),
            },
          };
        }
        case 'remove_pin':
          return {
            ok: true,
            data: {
              ...pins,
              [context.currentUser]: undefined,
            },
          };
        default:
          return { ok: false, conflict: `Unsupported pins operation: ${op}` };
      }
    },
  },
  spinHistory: {
    filename: 'spinhistory.json',
    parse: parseSpinHistory,
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => value as StateScopeDataMap['spinHistory'],
    mutate: (current, op, payload) => {
      const history = current as string[];

      if (op !== 'record_pick') {
        return { ok: false, conflict: `Unsupported spinHistory operation: ${op}` };
      }

      const title =
        typeof (payload as { title?: unknown }).title === 'string'
          ? sanitizeInput((payload as { title: string }).title)
          : '';

      if (!title) {
        return { ok: false, conflict: 'Invalid spin history title.' };
      }

      return {
        ok: true,
        data: appendSpinHistory(history, title, SPIN_HISTORY_MAX),
      };
    },
  },
  dailySpin: {
    filename: 'dailyspin.json',
    parse: parseDailySpin,
    serialize: (value) =>
      value ? JSON.stringify(value, null, 2) : '',
    toClient: (value) => value as StateScopeDataMap['dailySpin'],
    mutate: (current, op, payload, context) => {
      if (op !== 'record_daily') {
        return { ok: false, conflict: `Unsupported dailySpin operation: ${op}` };
      }

      const movieId =
        typeof (payload as { movieId?: unknown }).movieId === 'string'
          ? sanitizeInput((payload as { movieId: string }).movieId)
          : '';
      const movieTitle =
        typeof (payload as { movieTitle?: unknown }).movieTitle === 'string'
          ? sanitizeInput((payload as { movieTitle: string }).movieTitle)
          : '';

      if (!movieId || !movieTitle) {
        return { ok: false, conflict: 'Invalid daily spin payload.' };
      }

      const next = appendDailySpinEntry(current as DailySpinRecord | null, {
        movieId,
        movieTitle,
        spunBy: context.currentUser,
        createdAt: context.now,
      });

      return {
        ok: true,
        data: next,
      };
    },
  },
};

const getScopeDefinition = <TScope extends StateScope>(
  scope: TScope
): ScopeDefinition<TScope, unknown, StateScopeDataMap[TScope]> =>
  scopes[scope] as ScopeDefinition<TScope, unknown, StateScopeDataMap[TScope]>;

const readScopeStoredData = async <TScope extends StateScope>(
  scope: TScope,
  options: { bypassCache?: boolean } = {}
): Promise<{
  stored: unknown;
  clientData: StateScopeDataMap[TScope];
  version: string;
}> => {
  const definition = getScopeDefinition(scope);
  const content = await readGistFile(definition.filename, options);
  const stored = definition.parse(content);
  const clientData = definition.toClient(stored) as StateScopeDataMap[TScope];
  const version = computeVersion(clientData);

  return {
    stored,
    clientData,
    version,
  };
};

const buildFallbackScopeData = <TScope extends StateScope>(scope: TScope) => {
  const definition = getScopeDefinition(scope);
  const stored = definition.parse(null);
  const clientData = definition.toClient(stored) as StateScopeDataMap[TScope];
  const version = computeVersion(clientData);

  return {
    clientData,
    version,
  };
};

/**
 * Maps Gist/API errors to user-safe banner copy (no secrets). Exported for tests.
 */
export const getScopeWarning = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const msg = error.message;

  if (msg === 'GIST_ID is not configured.') {
    return 'Shared sync is unavailable because the server is missing GIST_ID. Set GIST_ID, or VITE_GIST_ID during local Vite development, to load and share data.';
  }

  if (msg === 'GITHUB_TOKEN is not configured.') {
    return 'Shared sync cannot write changes: GITHUB_TOKEN is not set on the server. Set a token with gist scope for updates (reads may still work for public Gists).';
  }

  const readMatch = /^Failed to read gist \((\d+)\)\.$/.exec(msg);
  if (readMatch) {
    const status = Number(readMatch[1]);
    if (status === 404) {
      return 'Shared sync cannot find the configured Gist. Verify GIST_ID or VITE_GIST_ID matches a GitHub Gist that exists.';
    }
    if (status === 401 || status === 403) {
      const token = process.env.GITHUB_TOKEN;
      const gistId = process.env.GIST_ID;
      const tokenDisplay = token
        ? `set (${token.slice(0, 4)}...${token.slice(-4)})`
        : 'NOT SET';
      const gistDisplay = gistId ?? 'NOT SET';
      return `GitHub rejected the Gist read (401/403). Check GITHUB_TOKEN has access to this Gist (required for private Gists). [GITHUB_TOKEN: ${tokenDisplay}, GIST_ID: ${gistDisplay}]`;
    }
    if (status === 429) {
      return 'GitHub API rate limit reached. Retry after a short wait.';
    }
    return `Shared state could not be loaded from GitHub (HTTP ${status}). Check server logs and https://www.githubstatus.com.`;
  }

  if (msg.includes('invalid JSON')) {
    return 'GitHub returned an unexpected response when loading the Gist. Check server logs.';
  }

  const updateMatch = /^Failed to update gist \((\d+)\)\.$/.exec(msg);
  if (updateMatch) {
    const status = Number(updateMatch[1]);
    if (status === 404) {
      return 'Shared sync cannot update the Gist (404). Verify the Gist id and that your token can edit it.';
    }
    if (status === 401 || status === 403) {
      return 'GitHub rejected the Gist update (401/403). Verify GITHUB_TOKEN has gist write access.';
    }
    if (status === 429) {
      return 'GitHub API rate limit reached while saving. Retry after a short wait.';
    }
    return `Shared state could not be saved to GitHub (HTTP ${status}). Check server logs.`;
  }

  return 'Shared state could not be loaded. Check server logs and GitHub connectivity.';
};

const parseMutationRequest = async (req: Request): Promise<MutationRequest> => {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    throw new Error('Invalid JSON payload.');
  }

  const body = payload as Partial<MutationRequest>;
  if (
    !body ||
    typeof body.baseVersion !== 'string' ||
    typeof body.op !== 'string'
  ) {
    throw new Error('Mutation requests must include baseVersion and op.');
  }

  return {
    baseVersion: body.baseVersion,
    op: body.op,
    payload: body.payload,
  };
};

export const getPinProtectedUsers = async (): Promise<User[]> => {
  try {
    const { stored } = await readScopeStoredData('pins');
    const pins = stored as UserPins;
    return (['Aaron', 'Electra'] as const).filter((user) => Boolean(pins[user]));
  } catch (error) {
    console.warn('Falling back to no protected users.', error);
    return [];
  }
};

export const verifyProfilePin = async (
  user: User,
  pin: string | undefined
): Promise<boolean> => {
  const { stored } = await readScopeStoredData('pins');
  const pins = stored as UserPins;
  const storedHash = pins[user];

  if (!storedHash) {
    return true;
  }

  return pin ? verifyStoredPin(pin, storedHash) : false;
};

export const createReadHandler =
  <TScope extends StateScope>(scope: TScope) =>
  async (req: Request): Promise<Response> => {
    try {
      if (req.method !== 'GET') {
        return methodNotAllowedResponse('GET');
      }

      if (!hasAccessSession(req)) {
        return unauthorizedResponse();
      }

      let clientData: StateScopeDataMap[TScope];
      let version: string;
      let degraded = false;
      let warning: string | undefined;

      try {
        const stored = await readScopeStoredData(scope);
        clientData = stored.clientData;
        version = stored.version;
      } catch (error) {
        const fallback = buildFallbackScopeData(scope);
        clientData = fallback.clientData;
        version = fallback.version;
        degraded = true;
        warning = getScopeWarning(error);
        console.warn(`Falling back to default ${scope} state.`, error);
      }

      const incomingEtag = normalizeEtag(req.headers.get('if-none-match'));
      if (!degraded && incomingEtag && incomingEtag === normalizeEtag(version)) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: toQuotedEtag(version),
            'Cache-Control': 'no-store',
          },
        });
      }

      return jsonResponse(
        {
          data: clientData,
          version,
          degraded,
          warning,
        },
        {
          headers: {
            ETag: toQuotedEtag(version),
          },
        }
      );
    } catch (error) {
      console.error(`Failed to read ${scope} state`, error);
      return serverErrorResponse();
    }
  };

export const createMutateHandler =
  <TScope extends StateScope>(scope: TScope) =>
  async (req: Request): Promise<Response> => {
    try {
      if (req.method !== 'POST') {
        return methodNotAllowedResponse('POST');
      }

      if (!hasAccessSession(req)) {
        return unauthorizedResponse();
      }

      const currentUser = requireProfileUser(req);
      if (!currentUser) {
        return unauthorizedResponse('Profile session required.');
      }

      const definition = getScopeDefinition(scope);
      if (!definition.mutate) {
        return badRequestResponse(`Mutations are not supported for ${scope}.`);
      }

      let mutation: MutationRequest;
      try {
        mutation = await parseMutationRequest(req);
      } catch (error) {
        return badRequestResponse(
          error instanceof Error ? error.message : 'Invalid mutation request.'
        );
      }

      const latest = await readScopeStoredData(scope, { bypassCache: true });
      const isVersionMismatch =
        normalizeEtag(mutation.baseVersion) !== normalizeEtag(latest.version);

      if (isVersionMismatch && definition.strictVersion) {
        return conflictResponse({
          currentData: latest.clientData,
          currentVersion: latest.version,
          conflict: 'State changed remotely. Refresh and retry.',
        });
      }

      const result = definition.mutate(latest.stored, mutation.op, mutation.payload, {
        currentUser,
        now: new Date().toISOString(),
      });

      if (!result.ok) {
        return conflictResponse({
          currentData: latest.clientData,
          currentVersion: latest.version,
          conflict: result.conflict,
        });
      }

      const clientData = definition.toClient(result.data) as StateScopeDataMap[TScope];
      const nextVersion = computeVersion(clientData);

      await patchGistFile(definition.filename, definition.serialize(result.data));

      return jsonResponse(
        {
          data: clientData,
          version: nextVersion,
          degraded: false,
          applied: true,
        },
        {
          headers: {
            ETag: toQuotedEtag(nextVersion),
          },
        }
      );
    } catch (error) {
      console.error(`Failed to mutate ${scope} state`, error);
      return serverErrorResponse();
    }
  };
