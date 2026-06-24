import type { StateEnvelope } from "./types";

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const getBaseUrl = () => (domain ? `https://${domain}` : "");

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  session: () => apiFetch<{ hasAccess: boolean; currentUser: string | null; pinProtectedUsers: string[]; usersMissingPins: string[] }>("/api/session"),

  state: {
    movies: () => apiFetch<StateEnvelope<import("./types").Movie[]>>("/api/state/movies"),
    places: () => apiFetch<StateEnvelope<import("./types").Place[]>>("/api/state/places"),
    memories: () => apiFetch<StateEnvelope<import("./types").SharedMemory[]>>("/api/state/memories"),
    suggestions: () => apiFetch<StateEnvelope<unknown[]>>("/api/state/suggestions"),

    mutate: <T>(scope: string, op: string, payload: unknown, baseVersion: string) =>
      apiFetch<{ applied: boolean; data: T; version: string }>(`/api/state/${scope}/mutate`, {
        method: "POST",
        body: JSON.stringify({ baseVersion, op, payload }),
      }),
  },

  omdb: (query: string) => apiFetch<import("./types").OmdbSearchResponse>(`/api/omdb?s=${encodeURIComponent(query)}`),
};
