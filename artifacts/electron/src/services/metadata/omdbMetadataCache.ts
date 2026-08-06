import { fetchOmdbMetadata } from "./omdb";
import type { MovieMetadata } from "./types";

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
  // If we're at or above the size, we need to remove enough items to get back under MAX_CACHE_SIZE
  // (Usually just 1, but we use a loop just in case)
  while (metadataCache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of metadataCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      metadataCache.delete(oldestKey);
    }
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
      // Refresh the timestamp to implement LRU behavior (if we want that, though LRU implies last *accessed*)
      // Actually, if we just update the timestamp on read, it becomes an LRU cache.
      // But the original code didn't specify LRU, it just said "cache". Let's update timestamp so it's LRU.
      cached.timestamp = now;
      return cached.promise;
    }
    // Expired
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

  // After setting, evict if we exceed MAX_CACHE_SIZE
  evictOldest();

  return request;
};

// For testing purposes
export const _clearCache = () => {
  metadataCache.clear();
};
