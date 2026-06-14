/**
 * Electron Mobile — API client.
 *
 * Mirrors the web app's Mode B data layer: direct fetch calls to
 * /api/state/:scope and /api/session. Cookies are managed by the
 * platform's native HTTP stack (iOS/Android cookie jar).
 */

export type User = "Aaron" | "Electra";

export function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "";
}

async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const base = getBaseUrl();
  const url = `${base}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

// ─── Session ────────────────────────────────────────────────────────────────

export interface SessionState {
  hasAccess: boolean;
  currentUser: User | null;
  pinProtectedUsers: User[];
  usersMissingPins: User[];
}

export async function getSession(): Promise<SessionState> {
  const res = await apiRequest("/api/session");
  if (!res.ok) throw new Error(`Session fetch failed: ${res.status}`);
  return res.json();
}

export async function signIn(user: User): Promise<SessionState> {
  const res = await apiRequest("/api/session/profile", {
    method: "POST",
    body: JSON.stringify({ user }),
  });
  if (!res.ok) throw new Error(`Sign-in failed: ${res.status}`);
  return res.json();
}

export async function signOut(): Promise<void> {
  await apiRequest("/api/session/profile", { method: "DELETE" });
}

// ─── State ───────────────────────────────────────────────────────────────────

export interface StateEnvelope<T> {
  data: T;
  version: string;
  degraded: boolean;
  warning?: string;
}

export async function getState<T>(scope: string): Promise<StateEnvelope<T>> {
  const res = await apiRequest(`/api/state/${scope}`);
  if (!res.ok) throw new Error(`State fetch failed for ${scope}: ${res.status}`);
  return res.json();
}

export interface MutateBody {
  op: string;
  baseVersion: string;
  payload?: unknown;
}

export async function mutateState<T>(
  scope: string,
  body: MutateBody
): Promise<StateEnvelope<T>> {
  const res = await apiRequest(`/api/state/${scope}/mutate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mutate failed for ${scope}: ${res.status} — ${text}`);
  }
  return res.json();
}

// ─── Movie search ─────────────────────────────────────────────────────────────

export async function searchMovieOmdb(title: string) {
  const res = await apiRequest(
    `/api/omdb?t=${encodeURIComponent(title)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.Response === "False") return null;
  return data;
}
