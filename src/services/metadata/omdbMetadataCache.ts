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

const evictOldestEntries = () => {
  if (metadataCache.size < MAX_CACHE_SIZE) {
    return;
  }
  // Evict expired entries first
  const now = Date.now();
  for (const [key, entry] of metadataCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      metadataCache.delete(key);
    }
  }
  // If still at capacity, evict oldest entries (insertion order)
  while (metadataCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = metadataCache.keys().next().value;
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
  const cached = metadataCache.get(key);
  if (cached) {
    // Check TTL
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      metadataCache.delete(key);
    } else {
      return cached.promise;
    }
  }

  evictOldestEntries();

  const request = fetchOmdbMetadata(title, type, imdbID, signal).catch(
    (error) => {
      metadataCache.delete(key);
      throw error;
    },
  );
  metadataCache.set(key, { promise: request, timestamp: Date.now() });
  return request;
};
