import type { QuizCharacter, QuizQuestion } from '../../components/quiz/lib/types.ts';
import type {
  MatchmakerGame,
  Message,
  Movie,
  MovieSuggestion,
  Place,
  PlaceSuggestion,
  SharedMemory,
  User,
} from '../../shared/types.ts';

export const STATE_SCOPES = [
  'movies',
  'messages',
  'memories',
  'places',
  'suggestions',
  'placeSuggestions',
  'quiz',
  'matchmaker',
  'pins',
  'spinHistory',
  'dailySpin',
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
  memories: SharedMemory[];
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
  pinProtectedUsers: User[];
  usersMissingPins: User[];
}

export type StateClientErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'invalid'
  | 'server'
  | 'network';

export class StateClientError extends Error {
  status: number;

  code: StateClientErrorCode;

  conflict?: ConflictResponse;

  constructor(
    message: string,
    status: number,
    code: StateClientErrorCode,
    conflict?: ConflictResponse
  ) {
    super(message);
    this.name = 'StateClientError';
    this.status = status;
    this.code = code;
    this.conflict = conflict;
  }
}
