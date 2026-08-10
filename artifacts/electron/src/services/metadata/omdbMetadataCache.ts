import { fetchOmdbMetadata } from "./omdb.ts";
import type { MovieMetadata } from "./types.ts";

const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  promise: Promise<MovieMetadata>;
  timestamp: number;
}

const metadataCache = new Map<string, CacheEntry>();

const buildCacheKey = (
  title: string,
  type?: string,
  imdbID?: string,
): string => `${imdbID ?? title.trim().toLowerCase()}::${type ?? "movie"}`;

const evictOldest = () => {
  while (metadataCache.size > MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of metadataCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (!oldestKey) break;
    metadataCache.delete(oldestKey);
  }
};

export const fetchOmdbMetadataCached = (
  title: string,
  type?: "movie" | "series",
  imdbID?: string,
  signal?: AbortSignal,
): Promise<MovieMetadata> => {
  const key = buildCacheKey(title, type, imdbID);
  const now = Date.now();
  const cached = metadataCache.get(key);

  if (cached) {
    if (now - cached.timestamp < CACHE_TTL_MS) {
      cached.timestamp = now;
      return cached.promise;
    }
    metadataCache.delete(key);
  }

  const request = fetchOmdbMetadata(title, type, imdbID, signal).catch(
    (error) => {
      metadataCache.delete(key);
      throw error;
    },
  );

  metadataCache.set(key, {
    promise: request,
    timestamp: now,
  });

  evictOldest();

  return request;
};

export const _clearCache = () => {
  metadataCache.clear();
};
