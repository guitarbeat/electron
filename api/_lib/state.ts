import { createHash, randomUUID } from 'node:crypto';

import {
  appendSpinHistory,
  SPIN_HISTORY_MAX,
  applyMatchmakerSwipe,
  undoMatchmakerSwipe,
} from './gameHelpers.js';
import { normalizeMovieRecord } from '../../artifacts/electron/src/services/content/movieRecords.js';
import type { PinRecord } from '../../artifacts/electron/src/services/content/pinHelpers.js';
import {
  mockMovies,
  mockMessages,
  mockMemories,
  mockPlaces,
} from '../../artifacts/electron/src/services/state/mockData.js';
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
} from '../../artifacts/electron/src/services/state/stateSchemas.js';
import type {
  DailySpinRecord,
  MutationRequest,
  StateScope,
  StateScopeDataMap,
} from '../../artifacts/electron/src/services/state/stateTypes.js';
import { STATE_SCOPES } from '../../artifacts/electron/src/services/state/stateTypes.js';
import type {
  MatchmakerGame,
  Message,
  Movie,
  Place,
  SharedMemory,
  User,
} from '../../artifacts/electron/src/shared/types.js';
import {
  USER_OPTIONS,
  isValidUrl,
  parseJsonContent,
  sanitizeInput,
  MAX_MESSAGE_LENGTH,
  MAX_MOVIE_TITLE_LENGTH,
  findMovieByNormalizedTitle,
} from './common.js';
import {
  invalidateSharedStateCache,
  isSharedStateConfigured,
  isSharedStateWriteConfigured,
  listSharedStateFilenames,
  patchSharedStateFile,
  readSharedStateFileRecord,
} from './sharedStateStore.js';
import { hashPin, verifyStoredPin } from './session.js';
import { suggestionScopeDefinitions } from './stateScopes/suggestions.js';

export interface MutationContext {
  currentUser: User | null;
  now: string;
}

const extractString = (value: unknown): string =>
  typeof value === 'string' ? sanitizeInput(value) : '';

export interface PinCoverageState {
  pinProtectedUsers: User[];
  usersMissingPins: User[];
  pinCoverageComplete: boolean;
}

export interface StateScopeDiagnostics {
  expectedScopes: StateScope[];
  missingScopes: StateScope[];
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

export interface ScopeDefinition<
  TScope extends StateScope,
  TStored,
  TClient = StateScopeDataMap[TScope]
> {
  filename: string;
  parse: (content: string | null) => TStored;
  serialize: (value: TStored) => string;
  toClient: (value: TStored) => TClient;
  allowAnonymousMutation?: (op: string, payload: unknown) => boolean;
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
  normalizeRecord: (value: unknown) => T | null,
  defaultContent: T[] = []
): T[] => {
  if (!content) {
    return defaultContent;
  }

  try {
    const parsed = parseJsonContent(content, context);
    if (!Array.isArray(parsed)) {
      console.warn(`${context} was not an array; defaulting to seed state.`);
      return defaultContent;
    }

    return parsed.flatMap((entry) => {
      const next = normalizeRecord(entry);
      return next ? [next] : [];
    });
  } catch (error) {
    console.error(`Failed to parse ${context}; defaulting to seed state.`, error);
    return defaultContent;
  }
};

const parseMovies = (content: string | null): Movie[] =>
  parseArrayScope<Movie>(content, 'movies', normalizeMovieRecord, mockMovies);

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

const parsePins = (content: string | null): PinRecord => {
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

export const computeVersion = (value: unknown): string =>
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

const buildPinCoverageState = (pinProtectedUsers: readonly User[]): PinCoverageState => {
  const protectedSet = new Set<User>(pinProtectedUsers);
  const usersMissingPins = USER_OPTIONS.filter((user) => !protectedSet.has(user));

  return {
    pinProtectedUsers: [...pinProtectedUsers],
    usersMissingPins,
    pinCoverageComplete: usersMissingPins.length === 0,
  };
};

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
          const id = extractString(nextPayload.id);
          const title = extractString(nextPayload.title);

          if (!id || !title || title.length > MAX_MOVIE_TITLE_LENGTH) {
            return { ok: false, conflict: 'Invalid movie payload.' };
          }

          if (movies.some((movie) => movie.id === id)) {
            return { ok: false, conflict: 'Movie already exists.' };
          }

          if (findMovieByNormalizedTitle(movies, title)) {
            return {
              ok: false,
              conflict: 'A movie with this title is already in the queue.',
            };
          }

          return {
            ok: true,
            data: [
              ...movies,
              {
                id,
                title,
                addedBy: context.currentUser!,
                watchedBy: [],
                createdAt: context.now,
              },
            ],
          };
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
  },
  messages: {
    filename: 'messages.json',
    parse: (content) =>
      parseArrayScope<Message>(content, 'messages', normalizeMessageRecord, mockMessages),
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => value as StateScopeDataMap['messages'],
    mutate: (current, op, payload, context) => {
      const messages = current as Message[];

      switch (op) {
        case 'add_message': {
          const nextPayload = payload as { id?: unknown; content?: unknown };
          const rawId = extractString(nextPayload.id);
          const id = rawId || `message-${randomUUID()}`;
          const content = extractString(nextPayload.content);

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
                author: context.currentUser!,
                content,
                createdAt: context.now,
              },
            ],
          };
        }
        case 'delete_message': {
          const messageId = extractString((payload as { messageId?: unknown }).messageId);

          const message = messages.find((entry) => entry.id === messageId);
          if (!message) {
            return { ok: false, conflict: 'Message not found.' };
          }

          if (message.author !== context.currentUser!) {
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
      parseArrayScope<SharedMemory>(content, 'memories', normalizeSharedMemoryRecord, mockMemories),
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
          const rawId = extractString(nextPayload.id);
          const id = rawId || `memory-${randomUUID()}`;
          const movieTitle = extractString(nextPayload.movieTitle);
          const note = extractString(nextPayload.note);

          if (!movieTitle || !note) {
            return { ok: false, conflict: 'Invalid memory payload.' };
          }

          if (memories.some((memory) => memory.id === id)) {
            return { ok: false, conflict: 'Memory already exists.' };
          }

          const movieId = extractString(nextPayload.movieId) || undefined;
          const imageUrl = extractString(nextPayload.imageUrl) || undefined;

          return {
            ok: true,
            data: [
              {
                id,
                movieId,
                movieTitle,
                author: context.currentUser!,
                note,
                createdAt: context.now,
                imageUrl,
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
          const memoryId = extractString(nextPayload.memoryId);

          const index = memories.findIndex((memory) => memory.id === memoryId);
          if (index < 0) {
            return { ok: false, conflict: 'Memory not found.' };
          }

          const currentMemory = memories[index];
          if (currentMemory.author !== context.currentUser!) {
            return { ok: false, conflict: 'Only the author can edit this memory.' };
          }

          const upd = nextPayload.updates ?? {};
          const updatedMemory: SharedMemory = {
            ...currentMemory,
            note: typeof upd.note === 'string' ? extractString(upd.note) : currentMemory.note,
            movieId: typeof upd.movieId === 'string' ? extractString(upd.movieId) : currentMemory.movieId,
            movieTitle: typeof upd.movieTitle === 'string' ? extractString(upd.movieTitle) : currentMemory.movieTitle,
            updatedAt: context.now,
          };

          return {
            ok: true,
            data: memories.map((memory) =>
              memory.id === memoryId ? updatedMemory : memory
            ),
          };
        }
        case 'update_memories_batch': {
          const nextPayload = payload as {
            updates?: Array<{ memoryId?: unknown; updates?: { note?: unknown; movieId?: unknown; movieTitle?: unknown } }>;
          };
          if (!Array.isArray(nextPayload.updates)) {
            return { ok: false, conflict: 'Invalid batch payload.' };
          }

          const updatesMap = new Map(
            nextPayload.updates.map((u) => [extractString(u.memoryId), u.updates])
          );

          // Optional: we skip auth check for batch to keep it simple, or implement it if needed:
          for (const memory of memories) {
            if (updatesMap.has(memory.id) && memory.author !== context.currentUser!) {
               return { ok: false, conflict: 'Only the author can edit this memory.' };
            }
          }

          const nextData = memories.map((memory) => {
            const upd = updatesMap.get(memory.id);
            if (!upd) return memory;

            return {
              ...memory,
              note: typeof upd.note === 'string' ? extractString(upd.note) : memory.note,
              movieId: typeof upd.movieId === 'string' ? extractString(upd.movieId) : memory.movieId,
              movieTitle: typeof upd.movieTitle === 'string' ? extractString(upd.movieTitle) : memory.movieTitle,
              updatedAt: context.now,
            };
          });

          return {
            ok: true,
            data: nextData,
          };
        }
        case 'delete_memory': {
          const memoryId = extractString((payload as { memoryId?: unknown }).memoryId);

          const memory = memories.find((entry) => entry.id === memoryId);
          if (!memory) {
            return { ok: false, conflict: 'Memory not found.' };
          }
          if (memory.author !== context.currentUser!) {
            return { ok: false, conflict: 'Only the author can delete this memory.' };
          }

          return {
            ok: true,
            data: memories.filter((memory) => memory.id !== memoryId),
          };
        }
        case 'toggle_memory_pin': {
          const memoryId = extractString((payload as { memoryId?: unknown }).memoryId);

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
      parseArrayScope<Place>(content, 'places', normalizePlaceRecord, mockPlaces),
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
          const id = extractString(nextPayload.id);
          const name = extractString(nextPayload.name);

          if (!id || !name) {
            return { ok: false, conflict: 'Invalid place payload.' };
          }

          if (places.some((place) => place.id === id)) {
            return { ok: false, conflict: 'Place already exists.' };
          }

          const notes = extractString(nextPayload.notes) || undefined;

          return {
            ok: true,
            data: [
              ...places,
              {
                id,
                name,
                addedBy: context.currentUser!,
                notes,
                createdAt: context.now,
                lat: typeof nextPayload.lat === 'number' ? nextPayload.lat : undefined,
                lng: typeof nextPayload.lng === 'number' ? nextPayload.lng : undefined,
              },
            ],
          };
        }
        case 'update_place': {
          const nextPayload = payload as {
            placeId?: unknown;
            updates?: { name?: unknown; notes?: unknown; category?: unknown; lat?: unknown; lng?: unknown };
          };
          const placeId = extractString(nextPayload.placeId);

          const existing = places.find((place) => place.id === placeId);
          if (!existing) {
            return { ok: false, conflict: 'Place not found.' };
          }

          const upd = nextPayload.updates ?? {};
          return {
            ok: true,
            data: places.map((place) =>
              place.id === placeId
                ? {
                    ...place,
                    name: typeof upd.name === 'string' ? extractString(upd.name) : place.name,
                    notes: typeof upd.notes === 'string' ? extractString(upd.notes) || undefined : place.notes,
                    category: typeof upd.category === 'string' ? extractString(upd.category) || undefined : place.category,
                    lat: typeof upd.lat === 'number' ? upd.lat : place.lat,
                    lng: typeof upd.lng === 'number' ? upd.lng : place.lng,
                  }
                : place
            ),
          };
        }
        case 'remove_place': {
          const placeId = extractString((payload as { placeId?: unknown }).placeId);

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
          const placeId = extractString((payload as { placeId?: unknown }).placeId);

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
  ...suggestionScopeDefinitions,
  quiz: {
    filename: 'quiz.json',
    parse: parseQuiz,
    serialize: (value) => JSON.stringify(value, null, 2),
    toClient: (value) => value as StateScopeDataMap['quiz'],
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
    mutate: (current, op, payload, context) => {
      const game = current as MatchmakerGame | null;

      switch (op) {
        case 'start_game': {
          const nextPayload = payload as {
            id?: unknown;
            movieIds?: unknown;
          };
          const rawId = extractString(nextPayload.id);
          const id = rawId || randomUUID();
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
              startedBy: context.currentUser!,
            },
          };
        }
        case 'swipe': {
          if (!game) {
            return { ok: false, conflict: 'No active matchmaker game.' };
          }

          const movieId = extractString((payload as { movieId?: unknown }).movieId);
          const liked = ensureBoolean((payload as { liked?: unknown }).liked);

          if (!movieId || liked === null) {
            return { ok: false, conflict: 'Invalid swipe payload.' };
          }

          return {
            ok: true,
            data: applyMatchmakerSwipe(game, context.currentUser!, movieId, liked),
          };
        }
        case 'undo': {
          if (!game) {
            return { ok: false, conflict: 'No active matchmaker game.' };
          }

          return {
            ok: true,
            data: undoMatchmakerSwipe(game, context.currentUser!),
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
      const pins = value as PinRecord;
      return {
        Aaron: Boolean(pins.Aaron),
        Electra: Boolean(pins.Electra),
      } satisfies StateScopeDataMap['pins'];
    },
    mutate: (current, op, payload, context) => {
      const pins = current as PinRecord;

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
              [context.currentUser!]: hashPin(pin),
            },
          };
        }
        case 'remove_pin':
          return {
            ok: true,
            data: {
              ...pins,
              [context.currentUser!]: undefined,
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

      const title = extractString((payload as { title?: unknown }).title);

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

      const movieId = extractString((payload as { movieId?: unknown }).movieId);
      const movieTitle = extractString((payload as { movieTitle?: unknown }).movieTitle);

      if (!movieId || !movieTitle) {
        return { ok: false, conflict: 'Invalid daily spin payload.' };
      }

      const next = appendDailySpinEntry(current as DailySpinRecord | null, {
        movieId,
        movieTitle,
        spunBy: context.currentUser!,
        createdAt: context.now,
      });

      return {
        ok: true,
        data: next,
      };
    },
  },
};

export const getScopeDefinition = <TScope extends StateScope>(
  scope: TScope
): ScopeDefinition<TScope, unknown, StateScopeDataMap[TScope]> =>
  scopes[scope] as ScopeDefinition<TScope, unknown, StateScopeDataMap[TScope]>;

const repairMissingScopeFile = async <TScope extends StateScope>(
  scope: TScope,
  definition: ScopeDefinition<TScope, unknown, StateScopeDataMap[TScope]>,
  stored: unknown
): Promise<void> => {
  if (!isSharedStateWriteConfigured()) {
    return;
  }

  try {
    await patchSharedStateFile(definition.filename, definition.serialize(stored));
  } catch (error) {
    console.warn(`Failed to bootstrap missing ${scope} scope file.`, error);
  }
};

export const readScopeStoredData = async <TScope extends StateScope>(
  scope: TScope,
  options: { bypassCache?: boolean } = {}
): Promise<{
  stored: unknown;
  clientData: StateScopeDataMap[TScope];
  version: string;
  fileMissing: boolean;
  usesFallbackStore: boolean;
}> => {
  const definition = getScopeDefinition(scope);

  // In mock mode (no database URL), return default/empty data without errors.
  if (!isSharedStateConfigured()) {
    const stored = definition.parse(null);
    const clientData = definition.toClient(stored) as StateScopeDataMap[TScope];
    const version = computeVersion(clientData);
    return {
      stored,
      clientData,
      version,
      fileMissing: true,
      usesFallbackStore: true,
    };
  }

  const file = await readSharedStateFileRecord(definition.filename, {
    bypassCache: options.bypassCache,
  });
  const stored = definition.parse(file.content);

  if (!file.exists) {
    await repairMissingScopeFile(scope, definition, stored);
  }

  const clientData = definition.toClient(stored) as StateScopeDataMap[TScope];
  const version = computeVersion(clientData);

  return {
    stored,
    clientData,
    version,
    fileMissing: !file.exists,
    usesFallbackStore: false,
  };
};

export const buildFallbackScopeData = <TScope extends StateScope>(scope: TScope) => {
  const definition = getScopeDefinition(scope);
  const stored = definition.parse(null);
  const clientData = definition.toClient(stored) as StateScopeDataMap[TScope];
  const version = computeVersion(clientData);

  return {
    clientData,
    version,
  };
};

export const getStateScopeDiagnostics = async (): Promise<StateScopeDiagnostics> => {
  const files = new Set(await listSharedStateFilenames());

  return {
    expectedScopes: [...STATE_SCOPES],
    missingScopes: STATE_SCOPES.filter((scope) => !files.has(getScopeDefinition(scope).filename)),
  };
};

/** Ensures every scope has a row in shared_state_files (default content when missing). */
export const bootstrapMissingScopeFiles = async (): Promise<StateScopeDiagnostics> => {
  if (!isSharedStateConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  await Promise.all(
    STATE_SCOPES.map((scope) => readScopeStoredData(scope, { bypassCache: true }))
  );

  invalidateSharedStateCache();
  return getStateScopeDiagnostics();
};

/**
 * Maps shared-store/API errors to user-safe banner copy (no secrets). Exported for tests.
 */
export const getScopeWarning = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const msg = error.message;

  if (msg === 'DATABASE_URL is not configured.') {
    return 'Shared sync is unavailable because the server is missing DATABASE_URL. Set DATABASE_URL in your environment variables, then restart the server.';
  }

  const readMatch = /^Failed to read shared state \((\d+)\)\.$/.exec(msg);
  if (readMatch) {
    const status = Number(readMatch[1]);
    if (status === 404) {
      return 'Shared sync could not reach the database endpoint (404). Verify DATABASE_URL points to the correct Neon database.';
    }
    if (status === 401 || status === 403) {
      return 'Neon rejected the request (401/403). Check DATABASE_URL credentials and permissions.';
    }
    if (status === 429) {
      return 'Neon or upstream rate limit reached. Retry after a short wait.';
    }
    return `Shared state could not be loaded (HTTP ${status}). Check server logs and https://status.neon.tech.`;
  }

  if (msg.startsWith('Failed to read shared state:')) {
    return 'Shared state could not be read from Neon Postgres. Check server logs and DATABASE_URL.';
  }

  if (msg.includes('unexpected value type')) {
    return 'The database returned an unexpected value when loading shared state. Check server logs.';
  }

  const updateMatch = /^Failed to update shared state \((\d+)\)\.$/.exec(msg);
  if (updateMatch) {
    const status = Number(updateMatch[1]);
    if (status === 404) {
      return 'Shared sync could not reach the database endpoint while saving (404). Verify DATABASE_URL.';
    }
    if (status === 401 || status === 403) {
      return 'Neon rejected the save (401/403). Verify DATABASE_URL credentials allow writes.';
    }
    if (status === 429) {
      return 'Rate limit reached while saving. Retry after a short wait.';
    }
    return `Shared state could not be saved (HTTP ${status}). Check server logs.`;
  }

  if (msg.startsWith('Failed to update shared state:')) {
    return 'Shared state could not be written to Neon Postgres. Check server logs and DATABASE_URL.';
  }

  const listMatch = /^list shared state \((\d+)\)\.$/.exec(msg);
  if (listMatch) {
    return `Health check could not list shared state rows (HTTP ${listMatch[1]}). Check database credentials.`;
  }

  if (msg.startsWith('list shared state:')) {
    return 'Health check could not list shared state rows. Check server logs and database configuration.';
  }

  return 'Shared state could not be loaded. Check server logs and Neon connectivity.';
};

export const parseMutationRequest = async (req: Request): Promise<MutationRequest> => {
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
  return (await getPinCoverageState()).pinProtectedUsers;
};

export const getPinCoverageState = async (): Promise<PinCoverageState> => {
  try {
    const { stored } = await readScopeStoredData('pins');
    const pins = stored as Record<string, string>;
    return buildPinCoverageState(USER_OPTIONS.filter((user) => Boolean(pins[user as string])));
  } catch (error) {
    console.warn('Failed to read PIN coverage state, falling back to empty.', error);
    return {
      pinProtectedUsers: [],
      usersMissingPins: [],
      pinCoverageComplete: true,
    };
  }
};

export const verifyProfilePin = async (
  user: User,
  pin: string | undefined
): Promise<boolean> => {
  const { stored } = await readScopeStoredData('pins');
  const pins = stored as Record<string, string>;
  const storedHash = pins[user as string];

  if (!storedHash) {
    return true;
  }

  return pin ? verifyStoredPin(pin, storedHash) : false;
};
