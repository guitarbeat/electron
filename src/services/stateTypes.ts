import type { QuizCharacter, QuizQuestion } from '../components/quiz/types.ts';
import type {
  MatchmakerGame,
  Message,
  Movie,
  MovieSuggestion,
  Place,
  SharedMemory,
  User,
} from '../shared/types.ts';

export const STATE_SCOPES = [
  'movies',
  'messages',
  'memories',
  'places',
  'suggestions',
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

/** Last wheel outcome for the UTC calendar day (Gist: dailyspin.json). */
export interface DailySpinRecord {
  date: string;
  movieId: string;
  movieTitle: string;
  spunBy: User;
  createdAt: string;
}

export interface StateScopeDataMap {
  movies: Movie[];
  messages: Message[];
  memories: SharedMemory[];
  places: Place[];
  suggestions: MovieSuggestion[];
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
}
