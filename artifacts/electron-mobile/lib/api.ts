import type { Movie, OmdbSearchResponse, Place, SharedMemory, StateEnvelope } from "./types";

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
  state: {
    movies: () => apiFetch<StateEnvelope<Movie[]>>("/api/state/movies"),
    places: () => apiFetch<StateEnvelope<Place[]>>("/api/state/places"),
    memories: () => apiFetch<StateEnvelope<SharedMemory[]>>("/api/state/memories"),

    mutate: <T>(scope: string, op: string, payload: unknown, baseVersion: string) =>
      apiFetch<{ applied: boolean; data: T; version: string }>(`/api/state/${scope}/mutate`, {
        method: "POST",
        body: JSON.stringify({ baseVersion, op, payload }),
      }),
  },

  omdb: (query: string) =>
    apiFetch<OmdbSearchResponse>(`/api/omdb?s=${encodeURIComponent(query)}`),
};
