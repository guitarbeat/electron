import type { Movie, MovieSuggestion, Place } from "@/shared/types";

export type StateScope = "movies" | "suggestions" | "messages" | "pins" | "quiz" | "places";

export interface QuizData {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface OutboxStatusSummary {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  lastSyncedAt?: string;
}

export interface SessionState {
  token: string | null;
  user: string | null;
}

export interface StateScopeDataMap {
  movies: Movie[];
  suggestions: MovieSuggestion[];
  messages: Array<Record<string, unknown>>;
  pins: Array<Record<string, unknown>>;
  quiz: QuizData[];
  places: Place[];
}

const localStateStore = new Map<StateScope, unknown>();

// Initialize default mock data
localStateStore.set("movies", []);
localStateStore.set("suggestions", []);
localStateStore.set("messages", []);
localStateStore.set("pins", []);
localStateStore.set("quiz", []);
localStateStore.set("places", []);

export const mockMessages = [
  { id: "m1", sender: "Aaron", text: "Hey! What should we watch tonight?", timestamp: new Date().toISOString() },
  { id: "m2", sender: "Electra", text: "Check out the suggestions tab!", timestamp: new Date().toISOString() },
];

export function getStoredScopeSnapshot<K extends StateScope>(scope: K): StateScopeDataMap[K] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(`app_scope_${scope}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore fallback
    }
  }
  return (localStateStore.get(scope) as StateScopeDataMap[K]) || ([] as unknown as StateScopeDataMap[K]);
}

export async function readScope<K extends StateScope>(
  scope: K,
  _options?: unknown,
): Promise<StateScopeDataMap[K]> {
  return getStoredScopeSnapshot(scope);
}

export async function mutateScope<K extends StateScope>(
  scope: K,
  data: StateScopeDataMap[K],
): Promise<void> {
  localStateStore.set(scope, data);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`app_scope_${scope}`, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent(`scope_update_${scope}`, { detail: data }));
    } catch {
      // Ignore
    }
  }
}

export async function retryScopeSync(scope: StateScope): Promise<void> {
  console.log(`Retrying scope sync for ${scope}`);
}

export function normalizeQuizData(data: unknown): QuizData[] {
  if (Array.isArray(data)) return data as QuizData[];
  return [];
}

export function getOutboxStatusSummary(): OutboxStatusSummary {
  return {
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
    lastSyncedAt: new Date().toISOString(),
  };
}

let sessionToken: string | null = null;

export function getStoredSessionToken(): string | null {
  if (sessionToken) return sessionToken;
  if (typeof window !== "undefined") {
    sessionToken = localStorage.getItem("app_session_token");
  }
  return sessionToken;
}

export function setStoredSessionToken(token: string): void {
  sessionToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("app_session_token", token);
  }
}

export const syncOutboxStatusEvent = new EventTarget();

export async function flushPendingSync(): Promise<void> {
  console.log("Flushing pending sync items");
}
