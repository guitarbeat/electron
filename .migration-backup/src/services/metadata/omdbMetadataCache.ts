import { fetchOmdbMetadata } from "./omdb";
import type { MovieMetadata } from "./types";

const metadataCache = new Map<string, Promise<MovieMetadata>>();

const buildCacheKey = (
  title: string,
  type?: string,
  imdbID?: string,
): string => `${imdbID ?? title.trim().toLowerCase()}::${type ?? "movie"}`;

export const fetchOmdbMetadataCached = (
  title: string,
  type?: "movie" | "series",
  imdbID?: string,
  signal?: AbortSignal,
): Promise<MovieMetadata> => {
  const key = buildCacheKey(title, type, imdbID);
  const cached = metadataCache.get(key);
  if (cached) {
    return cached;
  }

  const request = fetchOmdbMetadata(title, type, imdbID, signal).catch(
    (error) => {
      metadataCache.delete(key);
      throw error;
    },
  );
  metadataCache.set(key, request);
  return request;
};
