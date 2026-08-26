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

  // Issue the request without the caller's abort signal so that a single
  // caller aborting doesn't reject the shared cached promise for everyone.
  // The caller's signal is checked before and after the shared fetch.
  const request = fetchOmdbMetadata(title, type, imdbID).catch((error) => {
    metadataCache.delete(key);
    throw error;
  });
  metadataCache.set(key, { promise: request, timestamp: Date.now() });

  // If this specific caller has a signal, wrap the shared promise so their
  // abort only affects them, not other consumers of the cached entry.
  if (!signal) {
    return request;
  }

  return new Promise<MovieMetadata>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const onAbort = () => {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });

    request.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
};
