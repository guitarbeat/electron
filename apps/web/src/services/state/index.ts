import {
  characterDescriptions as defaultDescriptions,
  neitherDescription as defaultNeither,
  quizQuestions as defaultQuestions,
  isLegacyDefaultQuizQuestions,
  CHARACTERS,
  type QuizCharacter,
  type QuizQuestion,
} from "../../shared/quizData.js";
import { areDeeplyEqual } from "../../utils/index.js";
import {
  decodeStorageData,
  deepClone,
  encodeStorageData,
  isUser,
  parseJsonContent,
  sanitizeInput,
  isValidUrl,
} from "../../utils/shared.js";
import type {
  Movie,
  MovieSuggestion,
  Message,
  Place,
  PlaceSuggestion,
  MatchmakerGame,
  User,
} from "../../shared/types.js";
import { reconcileMatchmakerStatus } from "../../components/matchmaker/matchmakerGame.js";
import { normalizePinRecord, type PinRecord } from "../content/index.js";
import { z } from "zod";

// Mock movies data
export const mockMovies: Movie[] = [
  {
    id: "mock-1",
    title: "The Matrix",
    addedBy: "Aaron",
    watchedBy: ["Aaron"],
    createdAt: "2024-01-15T10:00:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_SX300.jpg",
    year: "1999",
    plot: "A computer hacker learns about the true nature of reality and his role in the war against its controllers.",
    imdbRating: "8.7",
    runtime: "136 min",
    genre: "Action, Sci-Fi",
    director: "Lana Wachowski, Lilly Wachowski",
  },
  {
    id: "mock-2",
    title: "Inception",
    addedBy: "Electra",
    watchedBy: [],
    createdAt: "2024-01-20T14:30:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
    year: "2010",
    plot: "A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea into the mind of a CEO.",
    imdbRating: "8.8",
    runtime: "148 min",
    genre: "Action, Adventure, Sci-Fi",
    director: "Christopher Nolan",
  },
  {
    id: "mock-3",
    title: "Spirited Away",
    addedBy: "Electra",
    watchedBy: ["Aaron", "Electra"],
    createdAt: "2024-01-10T09:00:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2YwOGUzYjRiXkEyXkFqcGc@._V1_SX300.jpg",
    year: "2001",
    plot: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches and spirits.",
    imdbRating: "8.6",
    runtime: "125 min",
    genre: "Animation, Adventure, Family",
    director: "Hayao Miyazaki",
  },
  {
    id: "mock-4",
    title: "Parasite",
    addedBy: "Aaron",
    watchedBy: ["Electra"],
    createdAt: "2024-02-01T18:00:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BYjk1Y2U4MjQtY2ZiNS00OWQyLWI3MmYtZWUwNmRjYWRiNWNhXkEyXkFqcGc@._V1_SX300.jpg",
    year: "2019",
    plot: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    imdbRating: "8.5",
    runtime: "132 min",
    genre: "Drama, Thriller",
    director: "Bong Joon Ho",
  },
  {
    id: "mock-5",
    title: "Everything Everywhere All at Once",
    addedBy: "Electra",
    watchedBy: [],
    createdAt: "2024-02-05T12:00:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BOWY3OTg3Y2UtYjE1NC00ZjllLWFiNTQtOGQ1NzZiMzZiMDc0XkEyXkFqcGc@._V1_SX300.jpg",
    year: "2022",
    plot: "A middle-aged Chinese immigrant is swept up into an insane adventure where she alone can save existence by exploring other universes.",
    imdbRating: "7.8",
    runtime: "139 min",
    genre: "Action, Adventure, Comedy",
    director: "Daniel Kwan, Daniel Scheinert",
  },
];

// Mock suggestions
export const mockSuggestions: MovieSuggestion[] = [
  {
    id: "sugg-1",
    title: "Dune: Part Two",
    suggestedBy: "Guest",
    reason: "The cinematography is incredible!",
    status: "pending",
    createdAt: "2024-02-10T08:00:00Z",
  },
  {
    id: "sugg-2",
    title: "Poor Things",
    suggestedBy: "Friend",
    reason: "Emma Stone is amazing in this",
    status: "pending",
    createdAt: "2024-02-08T16:00:00Z",
  },
];

// Mock messages
export const mockMessages: Message[] = [
  {
    id: "msg-1",
    author: "Aaron",
    content: "What should we watch tonight?",
    createdAt: "2024-02-10T19:00:00Z",
  },
  {
    id: "msg-2",
    author: "Electra",
    content: "I'm in the mood for something light and fun!",
    createdAt: "2024-02-10T19:05:00Z",
  },
  {
    id: "msg-3",
    author: "Aaron",
    content: "How about Everything Everywhere? We haven't watched it yet.",
    createdAt: "2024-02-10T19:08:00Z",
  },
];

// Mock places
export const mockPlaces: Place[] = [
  {
    id: "place-1",
    name: "Favorite Coffee Shop",
    addedBy: "Aaron",
    notes: "Best lattes in town, great for reading",
    createdAt: "2024-01-05T10:00:00Z",
    category: "Cafe",
    rating: "4.8",
    lat: 40.7128,
    lng: -74.006,
    imageUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80",
  },
  {
    id: "place-2",
    name: "Sunset Park",
    addedBy: "Electra",
    notes: "Perfect for evening walks and picnics",
    createdAt: "2024-01-12T15:00:00Z",
    visitedAt: "2024-02-01T17:30:00Z",
    category: "Park",
    rating: "4.5",
    lat: 40.6501,
    lng: -74.0027,
    imageUrl:
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&q=80",
  },
  {
    id: "place-3",
    name: "The Cozy Bookstore",
    addedBy: "Electra",
    notes: "Amazing selection of sci-fi and fantasy books",
    createdAt: "2024-01-20T11:00:00Z",
    category: "Bookstore",
    rating: "4.9",
    lat: 40.7484,
    lng: -73.9857,
    imageUrl:
      "https://images.unsplash.com/photo-1507842229452-96a92881a293?w=600&q=80",
  },
  {
    id: "place-4",
    name: "Skyline Rooftop Lounge",
    addedBy: "Aaron",
    notes: "Cocktails with an incredible downtown skyline view",
    createdAt: "2024-01-25T19:00:00Z",
    category: "Bar",
    rating: "4.7",
    lat: 40.7589,
    lng: -73.9851,
    imageUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80",
  },
  {
    id: "place-5",
    name: "Artisan Bakery & Cafe",
    addedBy: "Electra",
    notes: "Warm croissants and fresh sourdough on Sunday mornings",
    createdAt: "2024-02-02T09:30:00Z",
    category: "Bakery",
    rating: "4.9",
    lat: 40.7306,
    lng: -73.9352,
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  },
];

// Mock place suggestions
export const mockPlaceSuggestions: PlaceSuggestion[] = [
  {
    id: "place-sugg-1",
    name: "New Ramen Place",
    suggestedBy: "Aaron",
    notes: "Heard they have amazing tonkotsu ramen",
    category: "Restaurant",
    status: "pending",
    createdAt: "2024-02-08T12:00:00Z",
  },
];

// Mock quiz data
export const mockQuizData: QuizData = {
  questions: [],
  characterDescriptions: {
    Electra: "Electra",
    Aaron: "Aaron",
    Madeleine: "Madeleine",
    "Nosferatu/Smeemo": "Nosferatu/Smeemo",
  },
  neitherDescription: "Neither",
};

// Mock matchmaker game (null = no active game)
export const mockMatchmakerGame: MatchmakerGame | null = null;

// Mock pins (both users have set up PINs)
export const mockPins: PinsState = {
  Aaron: true,
  Electra: true,
};

// Mock spin history
export const mockSpinHistory: string[] = ["mock-1", "mock-3"];

// Mock daily spin
export const mockDailySpin: DailySpinRecord | null = null;

/**
 * Check if we're in mock mode (no backend configured)
 */
export const isMockMode = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  // Mock mode is opt-in. Real deployed environments with working `/api/*`
  // routes should use the backend by default.
  return window.localStorage.getItem("useMockData") === "true";
};

export const STATE_SCOPES = [
  "movies",
  "messages",
  "places",
  "suggestions",
  "placeSuggestions",
  "quiz",
  "matchmaker",
  "pins",
  "spinHistory",
  "dailySpin",
] as const;

export type StateScope = (typeof STATE_SCOPES)[number];

export const isStateScope = (value: string): value is StateScope =>
  STATE_SCOPES.includes(value as StateScope);

export interface QuizData {
  questions: QuizQuestion[];
  characterDescriptions: Record<QuizCharacter, string>;
  neitherDescription: string;
}

export interface PinsState {
  Aaron: boolean;
  Electra: boolean;
}

export interface SpinEntry {
  movieId: string;
  movieTitle: string;
  spunBy: User;
  createdAt: string;
}

/** All wheel outcomes for the UTC calendar day (shared store: dailyspin.json). */
export interface DailySpinRecord {
  date: string;
  spins: SpinEntry[];
}

export interface StateScopeDataMap {
  movies: Movie[];
  messages: Message[];
  places: Place[];
  suggestions: MovieSuggestion[];
  placeSuggestions: PlaceSuggestion[];
  quiz: QuizData;
  matchmaker: MatchmakerGame | null;
  pins: PinsState;
  spinHistory: string[];
  dailySpin: DailySpinRecord | null;
}

export interface StateEnvelope<T> {
  data: T;
  version: string;
  degraded: boolean;
  warning?: string;
}

export interface ScopeSnapshot<T> extends StateEnvelope<T> {
  blocked?: boolean;
}

export interface MutationRequest {
  baseVersion: string;
  op: string;
  payload: unknown;
}

export interface MutationResponse<T> extends StateEnvelope<T> {
  applied: boolean;
}

export interface ConflictResponse {
  currentData: unknown;
  currentVersion: string;
  conflict: string;
}

export interface PendingMutation {
  op: string;
  payload: unknown;
  consecutiveFailures?: number;
}

export interface ScopeOutbox {
  scope: StateScope;
  pendingOps: PendingMutation[];
  lastKnownVersion: string;
  degradedSince: string;
  blocked?: boolean;
}

export interface SessionState {
  hasAccess: boolean;
  currentUser: User | null;
  activeUsers?: User[];
  pinProtectedUsers: User[];
  usersMissingPins: User[];
}

export type StateClientErrorCode =
  "unauthorized" | "forbidden" | "conflict" | "invalid" | "server" | "network";

export class StateClientError extends Error {
  status: number;

  code: StateClientErrorCode;

  conflict?: ConflictResponse;

  constructor(
    message: string,
    status: number,
    code: StateClientErrorCode,
    conflict?: ConflictResponse,
  ) {
    super(message);
    this.name = "StateClientError";
    this.status = status;
    this.code = code;
    this.conflict = conflict;
  }
}

export type {
  MatchmakerGame,
  Message,
  Movie,
  MovieSuggestion,
  Place,
  PlaceSuggestion,
};

// Zod schemas for scope validation and rehydration
export const UserSchema = z.enum(["Aaron", "Electra"]);

export const MovieSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    addedBy: z.enum(["Aaron", "Electra"]).or(z.string().min(1)),
    watchedBy: z.array(z.string()).default([]),
    createdAt: z.string(),
    posterUrl: z.string().optional(),
    year: z.string().optional(),
    plot: z.string().optional(),
    imdbRating: z.string().optional(),
    runtime: z.string().optional(),
    genre: z.string().optional(),
    director: z.string().optional(),
    category: z.string().optional(),
    mediaType: z.enum(["movie", "series"]).optional(),
    votes: z.union([z.number(), z.record(z.any())]).optional(),
    voteCount: z.number().optional(),
  })
  .passthrough();

export const MovieSuggestionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    suggestedBy: z.string().min(1),
    reason: z.string().optional(),
    notes: z.string().optional(),
    imdbID: z.string().optional(),
    type: z.enum(["movie", "series"]).optional(),
    status: z.enum(["pending", "accepted", "rejected"]),
    createdAt: z.string(),
    respondedAt: z.string().optional(),
    respondedBy: z.enum(["Aaron", "Electra"]).optional(),
  })
  .passthrough();

export const MessageSchema = z
  .object({
    id: z.string().min(1),
    author: z.string().min(1),
    content: z.string(),
    createdAt: z.string(),
  })
  .passthrough();

export const PlaceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    addedBy: z.enum(["Aaron", "Electra"]).optional(),
    notes: z.string().optional(),
    createdAt: z.string(),
    visitedAt: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    category: z.string().optional(),
    rating: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
  })
  .passthrough();

export const PlaceSuggestionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    suggestedBy: z.string().min(1),
    createdAt: z.string(),
    notes: z.string().optional(),
    category: z.string().optional(),
    rating: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    status: z.enum(["pending", "accepted", "rejected"]),
    respondedAt: z.string().optional(),
    respondedBy: z.enum(["Aaron", "Electra"]).optional(),
  })
  .passthrough();

export const QuizDataSchema = z
  .object({
    questions: z.array(z.any()),
    characterDescriptions: z.record(z.string()),
    neitherDescription: z.string(),
  })
  .passthrough();

export const MatchmakerGameSchema = z
  .object({
    id: z.string(),
    moviePool: z.array(z.string()),
    aaronLikes: z.array(z.string()),
    electraLikes: z.array(z.string()),
    aaronDislikes: z.array(z.string()),
    electraDislikes: z.array(z.string()),
    aaronSwipeOrder: z.array(z.string()).optional(),
    electraSwipeOrder: z.array(z.string()).optional(),
    status: z.enum(["active", "completed"]),
    createdAt: z.string(),
    startedBy: z.enum(["Aaron", "Electra"]),
  })
  .passthrough()
  .nullable();

export const PinsStateSchema = z
  .object({
    Aaron: z.boolean(),
    Electra: z.boolean(),
  })
  .passthrough();

export const SpinHistorySchema = z.array(z.string());

export const DailySpinRecordSchema = z
  .object({
    date: z.string(),
    spins: z.array(
      z
        .object({
          movieId: z.string(),
          movieTitle: z.string(),
          spunBy: z.enum(["Aaron", "Electra"]).or(z.string()),
          createdAt: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough()
  .nullable();

export const StateScopeSchemas = {
  movies: z.array(MovieSchema),
  messages: z.array(MessageSchema),
  places: z.array(PlaceSchema),
  suggestions: z.array(MovieSuggestionSchema),
  placeSuggestions: z.array(PlaceSuggestionSchema),
  quiz: QuizDataSchema,
  matchmaker: MatchmakerGameSchema,
  pins: PinsStateSchema,
  spinHistory: SpinHistorySchema,
  dailySpin: DailySpinRecordSchema,
} as const;

export const validateScopeData = <TScope extends StateScope>(
  scope: TScope,
  data: unknown,
): StateScopeDataMap[TScope] | null => {
  if (
    data === undefined ||
    (data === null && scope !== "matchmaker" && scope !== "dailySpin")
  ) {
    return null;
  }
  const schema = StateScopeSchemas[scope];
  if (!schema) {
    return null;
  }
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data as StateScopeDataMap[TScope];
  }
  return null;
};

export const defaultQuizData: QuizData = {
  questions: defaultQuestions,
  characterDescriptions: defaultDescriptions,
  neitherDescription: defaultNeither,
};

export const cloneQuizData = (data: QuizData): QuizData => deepClone(data);

export const normalizeQuizData = (value: unknown): QuizData | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<QuizData> & {
    characterDescriptions?: Partial<Record<QuizCharacter, unknown>>;
    neitherDescription?: unknown;
  };

  if (!Array.isArray(candidate.questions)) {
    return null;
  }

  const shouldUpgradeLegacyDefaults = isLegacyDefaultQuizQuestions(
    candidate.questions,
  );

  const characterDescriptions = CHARACTERS.reduce<
    Record<QuizCharacter, string>
  >(
    (acc: Record<QuizCharacter, string>, character: QuizCharacter) => {
      const nextValue = shouldUpgradeLegacyDefaults
        ? undefined
        : candidate.characterDescriptions?.[character];
      acc[character] =
        typeof nextValue === "string"
          ? nextValue
          : defaultDescriptions[character];
      return acc;
    },
    {} as Record<QuizCharacter, string>,
  );

  return {
    questions:
      candidate.questions.length > 0 && !shouldUpgradeLegacyDefaults
        ? (candidate.questions as QuizQuestion[])
        : defaultQuestions,
    characterDescriptions,
    neitherDescription:
      !shouldUpgradeLegacyDefaults &&
      typeof candidate.neitherDescription === "string"
        ? candidate.neitherDescription
        : defaultNeither,
  };
};

export const cloneMessages = (messages: Message[]): Message[] =>
  messages.map((message) => ({
    ...message,
  }));

export const normalizeMessageRecord = (value: unknown): Message | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const message = value as Partial<Message>;
  const id = normalizeRequiredString(message.id);
  const author = normalizeRequiredString(message.author);
  const content = normalizeRequiredString(message.content);
  const createdAt = normalizeRequiredDate(message.createdAt);

  if (!id || !author || !content || !createdAt) {
    return null;
  }

  return {
    id,
    author,
    content,
    createdAt,
  };
};

export const isMessageRecord = (value: unknown): value is Message =>
  normalizeMessageRecord(value) !== null;

export const parseMessagesContent = (
  content: string | undefined,
): Message[] => {
  if (!content) {
    return [];
  }

  const parsed = parseJsonContent(content, "messages");
  return normalizeRecordList(parsed, normalizeMessageRecord);
};

const isSuggestionStatus = (
  value: unknown,
): value is MovieSuggestion["status"] =>
  value === "pending" || value === "accepted" || value === "rejected";

const isMovieSuggestionType = (
  value: unknown,
): value is NonNullable<MovieSuggestion["type"]> =>
  value === "movie" || value === "series";

export const normalizeSuggestionRecord = (
  value: unknown,
): MovieSuggestion | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const suggestion = value as Partial<MovieSuggestion>;
  const id = normalizeRequiredString(suggestion.id);
  const title = normalizeRequiredString(suggestion.title);
  const suggestedBy = normalizeRequiredString(suggestion.suggestedBy);
  const createdAt = normalizeRequiredDate(suggestion.createdAt);

  if (
    !id ||
    !title ||
    !suggestedBy ||
    !createdAt ||
    !isSuggestionStatus(suggestion.status)
  ) {
    return null;
  }

  return {
    id,
    title,
    suggestedBy,
    imdbID: normalizeOptionalString(suggestion.imdbID),
    type: isMovieSuggestionType(suggestion.type) ? suggestion.type : undefined,
    status: suggestion.status,
    createdAt,
    reason: normalizeOptionalString(suggestion.reason),
    respondedAt: normalizeOptionalDate(suggestion.respondedAt),
    respondedBy: isUser(suggestion.respondedBy)
      ? suggestion.respondedBy
      : undefined,
  };
};

export const normalizeSuggestions = (value: unknown): MovieSuggestion[] =>
  normalizeRecordList(value, normalizeSuggestionRecord);

const isPlaceSuggestionStatus = (
  value: unknown,
): value is PlaceSuggestion["status"] =>
  value === "pending" || value === "accepted" || value === "rejected";

export const normalizePlaceSuggestionRecord = (
  value: unknown,
): PlaceSuggestion | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const suggestion = value as Partial<PlaceSuggestion>;
  const id = normalizeRequiredString(suggestion.id);
  const name = normalizeRequiredString(suggestion.name);
  const suggestedBy = normalizeRequiredString(suggestion.suggestedBy);
  const createdAt = normalizeRequiredDate(suggestion.createdAt);

  if (
    !id ||
    !name ||
    !suggestedBy ||
    !createdAt ||
    !isPlaceSuggestionStatus(suggestion.status)
  ) {
    return null;
  }

  return {
    id,
    name,
    suggestedBy,
    status: suggestion.status,
    createdAt,
    notes: normalizeOptionalString(suggestion.notes),
    category: normalizeOptionalString(suggestion.category),
    rating: normalizeOptionalString(suggestion.rating),
    description: normalizeOptionalString(suggestion.description),
    imageUrl: normalizeOptionalUrl(suggestion.imageUrl),
    respondedAt: normalizeOptionalDate(suggestion.respondedAt),
    respondedBy: isUser(suggestion.respondedBy)
      ? suggestion.respondedBy
      : undefined,
  };
};

export const normalizePlaceSuggestions = (value: unknown): PlaceSuggestion[] =>
  normalizeRecordList(value, normalizePlaceSuggestionRecord);

export const clonePlaces = (places: Place[]): Place[] =>
  places.map((place) => ({
    ...place,
  }));

export const normalizePlaceRecord = (value: unknown): Place | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const place = value as Partial<Place>;
  const id = normalizeRequiredString(place.id);
  const name = normalizeRequiredString(place.name);
  const createdAt = normalizeRequiredDate(place.createdAt);

  if (!id || !name || !createdAt) {
    return null;
  }

  return {
    id,
    name,
    addedBy: isUser(place.addedBy) ? place.addedBy : undefined,
    notes: normalizeOptionalString(place.notes),
    createdAt,
    visitedAt: normalizeOptionalDate(place.visitedAt),
    lat: normalizeOptionalFiniteNumber(place.lat),
    lng: normalizeOptionalFiniteNumber(place.lng),
    category: normalizeOptionalString(place.category),
    rating: normalizeOptionalString(place.rating),
    description: normalizeOptionalString(place.description),
    imageUrl: normalizeOptionalUrl(place.imageUrl),
  };
};

export const normalizePlaces = (value: unknown): Place[] =>
  normalizeRecordList(value, normalizePlaceRecord);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isMatchmakerStatus = (
  value: unknown,
): value is MatchmakerGame["status"] =>
  value === "active" || value === "completed";

export const normalizeMatchmakerGame = (
  value: unknown,
): MatchmakerGame | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const game = value as Partial<MatchmakerGame>;
  const id = normalizeRequiredString(game.id);
  const createdAt = normalizeRequiredDate(game.createdAt);

  if (
    !id ||
    !createdAt ||
    !isUser(game.startedBy) ||
    !isMatchmakerStatus(game.status) ||
    !isStringArray(game.moviePool) ||
    !isStringArray(game.aaronLikes) ||
    !isStringArray(game.electraLikes) ||
    !isStringArray(game.aaronDislikes) ||
    !isStringArray(game.electraDislikes)
  ) {
    return null;
  }

  return reconcileMatchmakerStatus({
    id,
    createdAt,
    startedBy: game.startedBy,
    status: game.status,
    moviePool: [...game.moviePool],
    aaronLikes: [...game.aaronLikes],
    electraLikes: [...game.electraLikes],
    aaronDislikes: [...game.aaronDislikes],
    electraDislikes: [...game.electraDislikes],
    aaronSwipeOrder: isStringArray(game.aaronSwipeOrder)
      ? [...game.aaronSwipeOrder]
      : [],
    electraSwipeOrder: isStringArray(game.electraSwipeOrder)
      ? [...game.electraSwipeOrder]
      : [],
  });
};

export const cloneMatchmakerGame = (
  game: MatchmakerGame | null,
): MatchmakerGame | null =>
  game
    ? {
        ...game,
        moviePool: [...game.moviePool],
        aaronLikes: [...game.aaronLikes],
        electraLikes: [...game.electraLikes],
        aaronDislikes: [...game.aaronDislikes],
        electraDislikes: [...game.electraDislikes],
        aaronSwipeOrder: [...(game.aaronSwipeOrder ?? [])],
        electraSwipeOrder: [...(game.electraSwipeOrder ?? [])],
      }
    : null;

export const normalizePinsState = (value: unknown): PinsState => {
  const pins = normalizePinRecord(value);
  return {
    Aaron: Boolean(pins?.Aaron),
    Electra: Boolean(pins?.Electra),
  };
};

export const pinsStateFromHashes = (pins: PinRecord): PinsState => ({
  Aaron: Boolean(pins.Aaron),
  Electra: Boolean(pins.Electra),
});

export const normalizeStoredPins = (value: unknown): PinRecord =>
  normalizePinRecord(value) ?? {};

export const clonePinsState = (pins: PinsState): PinsState => ({ ...pins });

const spinHistoryTitleFromEntry = (entry: unknown): string | null => {
  if (typeof entry === "string") {
    const t = sanitizeInput(entry);
    return t || null;
  }
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const o = entry as { title?: unknown; movieTitle?: unknown };
  if (typeof o.title === "string") {
    const t = sanitizeInput(o.title);
    return t || null;
  }
  if (typeof o.movieTitle === "string") {
    const t = sanitizeInput(o.movieTitle);
    return t || null;
  }
  return null;
};

/** Normalize stored JSON: string[], legacy objects, or invalid → string[] (newest-first order preserved). */
export const normalizeSpinHistoryParsed = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => spinHistoryTitleFromEntry(entry))
    .filter((t): t is string => Boolean(t));
};

export const normalizeSpinEntry = (value: unknown): SpinEntry | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<SpinEntry>;
  const movieId = normalizeRequiredString(entry.movieId);
  const movieTitle = normalizeRequiredString(entry.movieTitle);
  const createdAt = normalizeRequiredDate(entry.createdAt);

  if (!movieId || !movieTitle || !createdAt || !isUser(entry.spunBy)) {
    return null;
  }

  return {
    movieId,
    movieTitle,
    spunBy: entry.spunBy,
    createdAt,
  };
};

export const appendDailySpinEntry = (
  current: DailySpinRecord | null,
  nextEntry: SpinEntry,
): DailySpinRecord => {
  const nextDate = nextEntry.createdAt.slice(0, 10);
  const spins = current?.date === nextDate ? current.spins : [];

  return {
    date: nextDate,
    spins: [...spins, nextEntry],
  };
};

export const normalizeDailySpinRecord = (
  value: unknown,
): DailySpinRecord | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DailySpinRecord> & Partial<SpinEntry>;
  const date = normalizeRequiredString(candidate.date);
  if (!date) {
    return null;
  }

  if (Array.isArray(candidate.spins)) {
    const spins = candidate.spins.flatMap((entry) => {
      const normalized = normalizeSpinEntry(entry);
      return normalized ? [normalized] : [];
    });

    return spins.length > 0 ? { date, spins } : null;
  }

  const legacyEntry = normalizeSpinEntry(candidate);
  if (!legacyEntry) {
    return null;
  }

  return {
    date,
    spins: [legacyEntry],
  };
};

// State management module

export const normalizeRequiredString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  return sanitizeInput(value) || null;
};

export const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return sanitizeInput(value) || undefined;
};

export const normalizeRequiredDate = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
};

export const normalizeOptionalDate = (value: unknown): string | undefined =>
  normalizeRequiredDate(value) ?? undefined;

export const normalizeOptionalUrl = (value: unknown): string | undefined => {
  const normalized = normalizeOptionalString(value);
  return normalized && isValidUrl(normalized) ? normalized : undefined;
};

export const normalizeOptionalFiniteNumber = (
  value: unknown,
): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const normalizeRecordList = <T>(
  value: unknown,
  normalizeRecord: (entry: unknown) => T | null,
): T[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const normalized = normalizeRecord(entry);
        return normalized === null ? [] : [normalized];
      })
    : [];

const VERSIONED_SNAPSHOT_PREFIX = "movienight_v1_scope_state_v1_";
const LEGACY_SNAPSHOT_PREFIX = "movieList.scopeSnapshot.";
const OUTBOX_PREFIX = "movieList.scopeOutbox.";
const SESSION_INVALID_EVENT = "movie-watch-session-invalid";
const OUTBOX_STATUS_EVENT = "movie-watch-outbox-status";

export const getScopeStorageKey = (scope: StateScope): string =>
  `${VERSIONED_SNAPSHOT_PREFIX}${scope}`;

/** Shown when fetch to /api/state fails (offline, dev server down, CORS). */
export const SYNC_WARNING_CLIENT_NETWORK =
  "Saving on this device — changes will sync when you're back online.";

/** Shown when local mutations are queued and not yet applied on the server. */
export const SYNC_WARNING_OUTBOX =
  "Some changes are waiting to sync to the server.";

interface StoredSnapshot<T> {
  data: T;
  version: string;
  degraded?: boolean;
  warning?: string;
}

const replayLocks = new Map<StateScope, Promise<ScopeSnapshot<unknown>>>();

/**
 * Scopes that returned a network error on the last read (server unreachable).
 * Tracked so flushPendingSync can clear stale degraded warnings even when no
 * mutations are queued — without requiring the hook's 15-second poll to fire.
 */
const degradedReadScopes = new Set<StateScope>();

const isBrowser = (): boolean => typeof window !== "undefined";

const snapshotKey = (scope: StateScope) => getScopeStorageKey(scope);
const outboxKey = (scope: StateScope) => `${OUTBOX_PREFIX}${scope}`;

export const clearInMemoryState = (): void => {
  mockStateStore.clear();
  replayLocks.clear();
  degradedReadScopes.clear();
};

const getDefaultScopeData = <TScope extends StateScope>(
  scope: TScope,
): StateScopeDataMap[TScope] => {
  switch (scope) {
    case "movies":
    case "messages":
    case "places":
    case "suggestions":
    case "placeSuggestions":
      return [] as unknown as StateScopeDataMap[TScope];
    case "quiz":
      return cloneQuizData(defaultQuizData) as StateScopeDataMap[TScope];
    case "matchmaker":
      return cloneMatchmakerGame(null) as StateScopeDataMap[TScope];
    case "pins":
      return {
        Aaron: false,
        Electra: false,
      } as StateScopeDataMap[TScope];
    case "spinHistory":
      return [] as unknown as StateScopeDataMap[TScope];
    case "dailySpin":
      return null as unknown as StateScopeDataMap[TScope];
    default:
      return [] as unknown as StateScopeDataMap[TScope];
  }
};

const getMockScopeData = <TScope extends StateScope>(
  scope: TScope,
): StateScopeDataMap[TScope] => {
  switch (scope) {
    case "movies":
      return deepClone(mockMovies) as StateScopeDataMap[TScope];
    case "messages":
      return deepClone(mockMessages) as StateScopeDataMap[TScope];
    case "places":
      return deepClone(mockPlaces) as StateScopeDataMap[TScope];
    case "suggestions":
      return deepClone(mockSuggestions) as StateScopeDataMap[TScope];
    case "placeSuggestions":
      return deepClone(mockPlaceSuggestions) as StateScopeDataMap[TScope];
    case "quiz":
      return deepClone(mockQuizData) as StateScopeDataMap[TScope];
    case "matchmaker":
      return deepClone(mockMatchmakerGame) as StateScopeDataMap[TScope];
    case "pins":
      return deepClone(mockPins) as StateScopeDataMap[TScope];
    case "spinHistory":
      return deepClone(mockSpinHistory) as StateScopeDataMap[TScope];
    case "dailySpin":
      return deepClone(mockDailySpin) as StateScopeDataMap[TScope];
    default:
      return getDefaultScopeData(scope);
  }
};

// In-memory mock state storage for mutations
const mockStateStore = new Map<StateScope, unknown>();

const getMockState = <TScope extends StateScope>(
  scope: TScope,
): StateScopeDataMap[TScope] => {
  if (mockStateStore.has(scope)) {
    return deepClone(mockStateStore.get(scope)) as StateScopeDataMap[TScope];
  }

  const stored = readSnapshot(scope);
  if (stored?.data !== undefined && stored.data !== null) {
    mockStateStore.set(scope, deepClone(stored.data));
    return deepClone(stored.data) as StateScopeDataMap[TScope];
  }

  const initialMock = getMockScopeData(scope);
  mockStateStore.set(scope, deepClone(initialMock));
  return deepClone(initialMock) as StateScopeDataMap[TScope];
};

const setMockState = <TScope extends StateScope>(
  scope: TScope,
  data: StateScopeDataMap[TScope],
): void => {
  mockStateStore.set(scope, deepClone(data));
  writeSnapshot(scope, {
    data: deepClone(data),
    version: "mock-version",
    degraded: false,
  });
};

const readJson = <T>(key: string): T | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
      const decoded = decodeStorageData(raw);
      return JSON.parse(decoded) as T;
    } catch {
      return JSON.parse(raw) as T;
    }
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    const encoded = encodeStorageData(JSON.stringify(value));
    window.localStorage.setItem(key, encoded);
  } catch {
    // Ignore storage errors; degraded sync still works in-memory for this session.
  }
};

const removeJson = (key: string): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
};

const readSnapshot = <TScope extends StateScope>(
  scope: TScope,
): StoredSnapshot<StateScopeDataMap[TScope]> | null => {
  if (!isBrowser()) {
    return null;
  }

  let raw = window.localStorage.getItem(snapshotKey(scope));
  if (!raw) {
    raw = window.localStorage.getItem(`${LEGACY_SNAPSHOT_PREFIX}${scope}`);
  }

  if (!raw) {
    return null;
  }

  try {
    let parsed: unknown;
    try {
      const decoded = decodeStorageData(raw);
      parsed = JSON.parse(decoded);
    } catch {
      parsed = JSON.parse(raw);
    }

    if (parsed === undefined) {
      return null;
    }

    const candidateObj =
      parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;

    const candidateData =
      candidateObj && "data" in candidateObj ? candidateObj.data : parsed;

    const validatedData = validateScopeData(scope, candidateData);
    if (validatedData === null) {
      console.warn(
        `Corrupted or obsolete stored data rejected for scope "${scope}".`,
      );
      return null;
    }

    return {
      data: validatedData,
      version:
        candidateObj && typeof candidateObj.version === "string"
          ? candidateObj.version
          : "local-v1",
      degraded:
        candidateObj && typeof candidateObj.degraded === "boolean"
          ? candidateObj.degraded
          : false,
      warning:
        candidateObj && typeof candidateObj.warning === "string"
          ? candidateObj.warning
          : undefined,
    };
  } catch (error) {
    console.warn(`Failed to parse stored snapshot for ${scope}.`, error);
    return null;
  }
};

const writeSnapshot = <TScope extends StateScope>(
  scope: TScope,
  snapshot: StoredSnapshot<StateScopeDataMap[TScope]>,
): void => {
  writeJson(snapshotKey(scope), snapshot);
  mockStateStore.set(scope, deepClone(snapshot.data));
};

const readOutbox = (scope: StateScope): ScopeOutbox | null =>
  readJson<ScopeOutbox>(outboxKey(scope));

export interface OutboxScopeStatus {
  scope: StateScope;
  pendingCount: number;
  blocked: boolean;
  degradedSince?: string;
}

export interface OutboxStatusSummary {
  pendingCount: number;
  blockedCount: number;
  pendingScopes: OutboxScopeStatus[];
  lastDegradedSince?: string;
}

const getOutboxStatusSummaryInternal = (): OutboxStatusSummary => {
  const pendingScopes = STATE_SCOPES.flatMap<OutboxScopeStatus>((scope) => {
    const outbox = readOutbox(scope);
    if (!outbox?.pendingOps.length) {
      return [];
    }

    return [
      {
        scope,
        pendingCount: outbox.pendingOps.length,
        blocked: Boolean(outbox.blocked),
        degradedSince: outbox.degradedSince,
      } satisfies OutboxScopeStatus,
    ];
  });

  return {
    pendingCount: pendingScopes.reduce<number>(
      (total, entry) => total + entry.pendingCount,
      0,
    ),
    blockedCount: pendingScopes.filter((entry) => entry.blocked).length,
    pendingScopes,
    lastDegradedSince: pendingScopes
      .map((entry) => entry.degradedSince)
      .filter((value): value is string => Boolean(value))
      .sort()[0],
  };
};

const emitOutboxStatus = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<OutboxStatusSummary>(OUTBOX_STATUS_EVENT, {
      detail: getOutboxStatusSummaryInternal(),
    }),
  );
};

const writeOutbox = (scope: StateScope, outbox: ScopeOutbox): void => {
  writeJson(outboxKey(scope), outbox);
  emitOutboxStatus();
};

const clearOutbox = (scope: StateScope): void => {
  removeJson(outboxKey(scope));
  emitOutboxStatus();
};

const notifySessionInvalid = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(SESSION_INVALID_EVENT));
};

const buildStateUrl = (scope: StateScope, mutate: boolean = false): string =>
  mutate ? `/api/state/${scope}/mutate` : `/api/state/${scope}`;

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch {
    throw new StateClientError(
      "Invalid JSON response.",
      response.status,
      "server",
    );
  }
};

const fetchStateFromServer = async <TScope extends StateScope>(
  scope: TScope,
  snapshot?: StoredSnapshot<StateScopeDataMap[TScope]> | null,
): Promise<Response> => {
  const headers = new Headers();
  if (snapshot?.version && !snapshot.degraded && !snapshot.warning) {
    headers.set("If-None-Match", `"${snapshot.version}"`);
  }

  return fetch(buildStateUrl(scope), {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
  });
};

const postMutation = async <TScope extends StateScope>(
  scope: TScope,
  body: {
    baseVersion: string;
    op: string;
    payload: unknown;
  },
): Promise<Response> =>
  fetch(buildStateUrl(scope, true), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(body),
  });

const readOptimisticSnapshot = <TScope extends StateScope>(
  scope: TScope,
): ScopeSnapshot<StateScopeDataMap[TScope]> => {
  const snapshot = readSnapshot(scope);
  if (snapshot) {
    const outbox = readOutbox(scope);
    const hasPending = Boolean(outbox?.pendingOps.length);

    return {
      data: snapshot.data,
      version: outbox?.lastKnownVersion ?? snapshot.version ?? "local-v1",
      degraded: hasPending || Boolean(snapshot.degraded),
      blocked: outbox?.blocked,
      warning:
        snapshot.warning ?? (hasPending ? SYNC_WARNING_OUTBOX : undefined),
    };
  }

  if (isMockMode()) {
    return {
      data: getMockState(scope),
      version: "mock-version",
      degraded: false,
      blocked: false,
      warning: undefined,
    };
  }

  return {
    data: deepClone(getDefaultScopeData(scope)),
    version: "",
    degraded: false,
    blocked: false,
    warning: undefined,
  };
};

const queueMutation = <TScope extends StateScope>(
  scope: TScope,
  op: string,
  payload: unknown,
  optimisticData: StateScopeDataMap[TScope],
  currentVersion: string,
): ScopeSnapshot<StateScopeDataMap[TScope]> => {
  const existing = readOutbox(scope);
  const storedSnapshot = readSnapshot(scope);
  const nextOutbox: ScopeOutbox = {
    scope,
    pendingOps: [...(existing?.pendingOps ?? []), { op, payload }],
    lastKnownVersion: existing?.lastKnownVersion || currentVersion,
    degradedSince: existing?.degradedSince || new Date().toISOString(),
    blocked: false,
  };

  writeOutbox(scope, nextOutbox);
  writeSnapshot(scope, {
    data: optimisticData,
    version: nextOutbox.lastKnownVersion,
    degraded: true,
    warning: storedSnapshot?.warning ?? SYNC_WARNING_OUTBOX,
  });

  return {
    data: optimisticData,
    version: nextOutbox.lastKnownVersion,
    degraded: true,
    blocked: false,
    warning: storedSnapshot?.warning ?? SYNC_WARNING_OUTBOX,
  };
};

const replayOutbox = async <TScope extends StateScope>(
  scope: TScope,
  base: StateEnvelope<StateScopeDataMap[TScope]>,
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  const existingLock = replayLocks.get(scope);
  if (existingLock) {
    return (await existingLock) as ScopeSnapshot<StateScopeDataMap[TScope]>;
  }

  const promise = (async () => {
    const storedSnapshot = readSnapshot(scope);
    const optimisticSnapshot = readOptimisticSnapshot(scope);
    let outbox = readOutbox(scope);
    if (!outbox || outbox.pendingOps.length === 0 || outbox.blocked) {
      return optimisticSnapshot;
    }

    let latestVersion = base.version;
    let latestData = base.data;

    while (outbox.pendingOps.length > 0) {
      const [nextOp, ...remaining] = outbox.pendingOps;

      try {
        const response = await postMutation(scope, {
          baseVersion: latestVersion,
          op: nextOp.op,
          payload: nextOp.payload,
        });

        if (response.status === 401 || response.status === 403) {
          notifySessionInvalid();
          writeOutbox(scope, {
            ...outbox,
            blocked: true,
            pendingOps: [nextOp, ...remaining],
          });
          return {
            data: storedSnapshot?.data ?? optimisticSnapshot.data,
            version: latestVersion,
            degraded: true,
            blocked: true,
            warning: storedSnapshot?.warning ?? optimisticSnapshot.warning,
          };
        }

        if (response.status === 409) {
          // The queued op was rejected by the server (business-logic conflict,
          // e.g. "Movie already exists" because the other device already wrote it).
          // Parse the conflict body to learn the current server state, skip this
          // stale op, and continue replaying the rest of the queue.  Only block the
          // outbox if the conflict body itself can't be parsed.
          let conflictVersion = latestVersion;
          let conflictData = latestData;
          try {
            const conflict =
              await parseJsonResponse<ConflictResponse>(response);
            conflictVersion = conflict.currentVersion;
            conflictData = conflict.currentData as StateScopeDataMap[TScope];
          } catch {
            writeOutbox(scope, {
              ...outbox,
              blocked: true,
              pendingOps: [nextOp, ...remaining],
              lastKnownVersion: latestVersion,
            });
            return {
              data: storedSnapshot?.data ?? optimisticSnapshot.data,
              version: latestVersion,
              degraded: true,
              blocked: true,
              warning: storedSnapshot?.warning ?? optimisticSnapshot.warning,
            };
          }
          latestVersion = conflictVersion;
          latestData = conflictData;
          outbox = {
            ...outbox,
            pendingOps: remaining,
            lastKnownVersion: latestVersion,
          };
          if (remaining.length > 0) {
            writeOutbox(scope, outbox);
          }
          continue;
        }

        if (!response.ok) {
          const updatedFailures = (nextOp.consecutiveFailures ?? 0) + 1;
          const MAX_CONSECUTIVE_FAILURES = 3;
          if (updatedFailures >= MAX_CONSECUTIVE_FAILURES) {
            const blockedOutbox = {
              ...outbox,
              blocked: true,
              pendingOps: [
                { ...nextOp, consecutiveFailures: updatedFailures },
                ...remaining,
              ],
            };
            writeOutbox(scope, blockedOutbox);
            return {
              data: storedSnapshot?.data ?? optimisticSnapshot.data,
              version: latestVersion,
              degraded: true,
              blocked: true,
              warning:
                "A change could not be saved after multiple attempts. Refresh to retry.",
            };
          }
          writeOutbox(scope, {
            ...outbox,
            pendingOps: [
              { ...nextOp, consecutiveFailures: updatedFailures },
              ...remaining,
            ],
          });
          return {
            data: storedSnapshot?.data ?? optimisticSnapshot.data,
            version: latestVersion,
            degraded: true,
            blocked: false,
            warning: storedSnapshot?.warning ?? optimisticSnapshot.warning,
          };
        }

        const parsed =
          await parseJsonResponse<MutationResponse<StateScopeDataMap[TScope]>>(
            response,
          );
        latestVersion = parsed.version;
        latestData = parsed.data;
        outbox = {
          ...outbox,
          pendingOps: remaining,
          lastKnownVersion: latestVersion,
        };

        if (remaining.length > 0) {
          writeOutbox(scope, outbox);
        }
      } catch {
        return {
          data: storedSnapshot?.data ?? optimisticSnapshot.data,
          version: latestVersion,
          degraded: true,
          blocked: false,
          warning: storedSnapshot?.warning ?? optimisticSnapshot.warning,
        };
      }
    }

    clearOutbox(scope);
    writeSnapshot(scope, {
      data: latestData,
      version: latestVersion,
      degraded: false,
    });

    return {
      data: latestData,
      version: latestVersion,
      degraded: false,
      blocked: false,
      warning: undefined,
    };
  })();

  replayLocks.set(scope, promise as Promise<ScopeSnapshot<unknown>>);

  try {
    return await promise;
  } finally {
    replayLocks.delete(scope);
  }
};

export const readScope = async <TScope extends StateScope>(
  scope: TScope,
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  // Return mock data immediately in mock mode - no API calls
  if (isMockMode()) {
    return {
      data: getMockState(scope),
      version: "mock-version",
      degraded: false,
      blocked: false,
      warning: undefined,
    };
  }

  const outbox = readOutbox(scope);
  if (outbox?.blocked) {
    return readOptimisticSnapshot(scope);
  }

  const stored = readSnapshot(scope);

  try {
    const response = await fetchStateFromServer(
      scope,
      stored
        ? {
            ...stored,
            version: outbox?.lastKnownVersion || stored.version,
          }
        : null,
    );

    if (response.status === 401 || response.status === 403) {
      notifySessionInvalid();
      throw new StateClientError(
        "Unauthorized.",
        response.status,
        "unauthorized",
      );
    }

    if (response.status === 304 && stored) {
      if (outbox?.pendingOps.length) {
        return replayOutbox(scope, {
          data: stored.data,
          version: outbox.lastKnownVersion || stored.version,
          degraded: Boolean(stored.degraded),
          warning: stored.warning,
        });
      }

      return {
        data: stored.data,
        version: stored.version,
        degraded: Boolean(stored.degraded),
        blocked: false,
        warning: stored.warning,
      };
    }

    if (!response.ok) {
      throw new StateClientError(
        "State request failed.",
        response.status,
        "server",
      );
    }

    const parsed =
      await parseJsonResponse<StateEnvelope<StateScopeDataMap[TScope]>>(
        response,
      );

    if (outbox?.pendingOps.length) {
      return replayOutbox(scope, parsed);
    }

    writeSnapshot(scope, {
      data: parsed.data,
      version: parsed.version,
      degraded: parsed.degraded,
      warning: parsed.warning,
    });

    // Successful read — scope is no longer in a degraded network state.
    degradedReadScopes.delete(scope);

    return {
      data: parsed.data,
      version: parsed.version,
      degraded: parsed.degraded,
      blocked: false,
      warning: parsed.warning,
    };
  } catch (error) {
    if (error instanceof StateClientError && error.code === "unauthorized") {
      throw error;
    }

    // Network read failed — record scope so flushPendingSync can retry it
    // promptly when the browser comes back online or the tab regains focus,
    // without waiting for the hook's next polling interval.
    degradedReadScopes.add(scope);

    if (stored) {
      return {
        data: stored.data,
        version: outbox?.lastKnownVersion || stored.version,
        degraded: true,
        blocked: outbox?.blocked,
        warning: stored.warning ?? SYNC_WARNING_CLIENT_NETWORK,
      };
    }

    return {
      data: deepClone(getDefaultScopeData(scope)),
      version: "",
      degraded: true,
      blocked: outbox?.blocked,
      warning: SYNC_WARNING_CLIENT_NETWORK,
    };
  }
};

export const retryScopeSync = async <TScope extends StateScope>(
  scope: TScope,
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  const outbox = readOutbox(scope);
  if (outbox) {
    writeOutbox(scope, {
      ...outbox,
      blocked: false,
    });
  }

  return readScope(scope);
};

export const mutateScope = async <TScope extends StateScope>(
  scope: TScope,
  options: {
    op: string;
    payload: unknown;
    optimisticData: StateScopeDataMap[TScope];
  },
): Promise<ScopeSnapshot<StateScopeDataMap[TScope]>> => {
  // In mock mode, just update the in-memory store and return success
  if (isMockMode()) {
    setMockState(scope, options.optimisticData);
    return {
      data: options.optimisticData,
      version: "mock-version",
      degraded: false,
      blocked: false,
      warning: undefined,
    };
  }

  const outbox = readOutbox(scope);
  if (outbox?.blocked) {
    throw new StateClientError(
      "Sync is blocked for this section. Refresh and retry.",
      409,
      "conflict",
    );
  }

  const latestSnapshot = await readScope(scope);
  const currentVersion =
    readOutbox(scope)?.lastKnownVersion || latestSnapshot.version;

  try {
    const response = await postMutation(scope, {
      baseVersion: currentVersion,
      op: options.op,
      payload: options.payload,
    });

    if (response.status === 401 || response.status === 403) {
      notifySessionInvalid();
      throw new StateClientError(
        "Unauthorized.",
        response.status,
        "unauthorized",
      );
    }

    if (response.status === 409) {
      const conflict = await parseJsonResponse<ConflictResponse>(response);
      throw new StateClientError(conflict.conflict, 409, "conflict", conflict);
    }

    if (response.status >= 500) {
      return queueMutation(
        scope,
        options.op,
        options.payload,
        options.optimisticData,
        currentVersion,
      );
    }

    if (!response.ok) {
      throw new StateClientError(
        "Mutation failed.",
        response.status,
        "invalid",
      );
    }

    const parsed =
      await parseJsonResponse<MutationResponse<StateScopeDataMap[TScope]>>(
        response,
      );
    clearOutbox(scope);
    writeSnapshot(scope, {
      data: parsed.data,
      version: parsed.version,
      degraded: false,
    });

    return {
      data: parsed.data,
      version: parsed.version,
      degraded: false,
      blocked: false,
      warning: undefined,
    };
  } catch (error) {
    if (error instanceof StateClientError) {
      if (
        error.code === "unauthorized" ||
        error.code === "conflict" ||
        error.code === "invalid"
      ) {
        throw error;
      }

      return queueMutation(
        scope,
        options.op,
        options.payload,
        options.optimisticData,
        currentVersion,
      );
    }

    return queueMutation(
      scope,
      options.op,
      options.payload,
      options.optimisticData,
      currentVersion,
    );
  }
};

export const getStoredScopeSnapshot = <TScope extends StateScope>(
  scope: TScope,
): ScopeSnapshot<StateScopeDataMap[TScope]> => readOptimisticSnapshot(scope);

export const sessionInvalidationEvent = SESSION_INVALID_EVENT;
export const syncOutboxStatusEvent = OUTBOX_STATUS_EVENT;
export const getOutboxStatusSummary = (): OutboxStatusSummary =>
  getOutboxStatusSummaryInternal();

export const flushPendingSync = async (): Promise<OutboxStatusSummary> => {
  const summary = getOutboxStatusSummaryInternal();

  // Collect scopes with queued mutations AND scopes that had a network read
  // failure (degradedReadScopes).  The latter would otherwise linger until the
  // hook's next 15-second poll, even when the browser just came back online or
  // the tab regained focus.
  const pendingScopeSet = new Set(summary.pendingScopes.map((e) => e.scope));
  const degradedOnlyScopes = [...degradedReadScopes].filter(
    (s) => !pendingScopeSet.has(s),
  );

  const allScopesToRetry = [
    ...summary.pendingScopes.map((e) => e.scope),
    ...degradedOnlyScopes,
  ];

  if (allScopesToRetry.length === 0) {
    return summary;
  }

  await Promise.allSettled(
    allScopesToRetry.map((scope) => retryScopeSync(scope)),
  );

  return getOutboxStatusSummaryInternal();
};

/**
 * Fast path when version + metadata match; still compares data if the reference changed.
 * Safe when the API bumps version on every data mutation (including 304 outbox replay in stateClient).
 */
export const areScopeSnapshotsEqual = <T>(
  prev: ScopeSnapshot<T> | undefined,
  next: ScopeSnapshot<T>,
): boolean => {
  if (prev === next) {
    return true;
  }

  if (!prev) {
    return false;
  }

  if (
    prev.version &&
    next.version &&
    prev.version === next.version &&
    prev.degraded === next.degraded &&
    prev.blocked === next.blocked &&
    prev.warning === next.warning
  ) {
    if (prev.data === next.data) {
      return true;
    }
    return areDeeplyEqual(prev.data, next.data);
  }

  return areDeeplyEqual(prev, next);
};
