import { warmServiceWorkerMedia } from "./swMediaCache.js";
import { getCatPosterUrl } from "../utils/catPosters.js";

/**
 * Service to locally cache movie poster images using IndexedDB and the Cache Storage API.
 * This guarantees the watchlist remains visually complete even when the user is offline.
 */

export const POSTER_CACHE_VERSION = "v13";
export const MEDIA_CACHE_NAME = `electron-media-${POSTER_CACHE_VERSION}`;
export const POSTER_IDB_NAME = "electron_posters_cache";
export const POSTER_IDB_STORE = "posters";
export const POSTER_IDB_VERSION = 1;

export interface CachedPosterRecord {
  url: string;
  blob?: Blob;
  dataUrl?: string;
  mimeType: string;
  cachedAt: number;
}

// In-memory cache mapping original URL -> resolved local object URL or data URL
const inMemoryObjectUrls = new Map<string, string>();
const inflightFetches = new Map<string, Promise<string | null>>();

/**
 * Checks if a string is a valid URL for caching
 */
export const isValidPosterUrl = (url: unknown): url is string => {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "N/A") return false;
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    (trimmed.startsWith("/") && !trimmed.startsWith("/api/"))
  );
};

/**
 * IndexedDB connection helper with safe fallbacks
 */
let dbPromise: Promise<IDBDatabase | null> | null = null;

const getPosterDB = (): Promise<IDBDatabase | null> => {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(POSTER_IDB_NAME, POSTER_IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(POSTER_IDB_STORE)) {
          db.createObjectStore(POSTER_IDB_STORE, { keyPath: "url" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
};

/**
 * Save poster to IndexedDB
 */
const saveToIDB = async (url: string, blob: Blob): Promise<void> => {
  const db = await getPosterDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(POSTER_IDB_STORE, "readwrite");
      const store = tx.objectStore(POSTER_IDB_STORE);
      const record: CachedPosterRecord = {
        url,
        blob,
        mimeType: blob.type || "image/jpeg",
        cachedAt: Date.now(),
      };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
};

/**
 * Retrieve poster blob from IndexedDB
 */
const getFromIDB = async (url: string): Promise<Blob | null> => {
  const db = await getPosterDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(POSTER_IDB_STORE, "readonly");
      const store = tx.objectStore(POSTER_IDB_STORE);
      const request = store.get(url);
      request.onsuccess = () => {
        const result = request.result as CachedPosterRecord | undefined;
        if (result && result.blob instanceof Blob) {
          resolve(result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

/**
 * Save to Cache Storage API (accessible to both Window and Service Worker)
 */
const saveToCacheStorage = async (url: string, response: Response): Promise<void> => {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    const cache = await window.caches.open(MEDIA_CACHE_NAME);
    await cache.put(url, response);
  } catch {
    // Non-fatal if cache storage quota is reached or blocked
  }
};

/**
 * Get from Cache Storage API
 */
const getFromCacheStorage = async (url: string): Promise<Blob | null> => {
  if (typeof window === "undefined" || !("caches" in window)) return null;
  try {
    const cache = await window.caches.open(MEDIA_CACHE_NAME);
    const match = await cache.match(url);
    if (match) {
      return await match.blob();
    }
  } catch {
    // Non-fatal
  }
  return null;
};

/**
 * Converts a Blob to an Object URL or memory URL safely
 */
const createSafeObjectUrl = (blob: Blob): string | null => {
  if (typeof window !== "undefined" && typeof window.URL !== "undefined" && typeof window.URL.createObjectURL === "function") {
    try {
      return window.URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Synchronously retrieves a cached poster URL from memory if already resolved.
 */
export const getCachedPosterUrlSync = (url?: string | null): string | null => {
  if (!url || !isValidPosterUrl(url)) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  return inMemoryObjectUrls.get(url) || null;
};

/**
 * Retrieves a locally cached poster URL for offline display.
 * Checks in-memory cache, then IndexedDB, then Cache Storage.
 */
export const getCachedPosterUrl = async (url?: string | null): Promise<string | null> => {
  if (!url || !isValidPosterUrl(url)) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  // 1. Check in-memory cache
  const inMemory = inMemoryObjectUrls.get(url);
  if (inMemory) return inMemory;

  // 2. Check IndexedDB
  try {
    const blobFromIdb = await getFromIDB(url);
    if (blobFromIdb) {
      const objectUrl = createSafeObjectUrl(blobFromIdb);
      if (objectUrl) {
        inMemoryObjectUrls.set(url, objectUrl);
        return objectUrl;
      }
    }
  } catch {
    // Proceed to Cache Storage fallback
  }

  // 3. Check Cache Storage
  try {
    const blobFromCache = await getFromCacheStorage(url);
    if (blobFromCache) {
      // Save back to IDB for fast secondary access
      void saveToIDB(url, blobFromCache);
      const objectUrl = createSafeObjectUrl(blobFromCache);
      if (objectUrl) {
        inMemoryObjectUrls.set(url, objectUrl);
        return objectUrl;
      }
    }
  } catch {
    // Fallthrough
  }

  return null;
};

/**
 * Caches a single movie poster image locally.
 * Fetches the image with CORS, saves to IndexedDB and CacheStorage,
 * and falls back to opaque CacheStorage caching if CORS is not allowed.
 */
export const cachePosterLocally = async (url?: string | null): Promise<string | null> => {
  if (!url || !isValidPosterUrl(url)) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    inMemoryObjectUrls.set(url, url);
    return url;
  }

  // If already resolved, return it
  const cached = await getCachedPosterUrl(url);
  if (cached) return cached;

  // Deduplicate inflight requests
  if (inflightFetches.has(url)) {
    return inflightFetches.get(url)!;
  }

  const fetchPromise = (async (): Promise<string | null> => {
    try {
      if (typeof fetch === "undefined") return null;

      // 1. Try CORS fetch so we can obtain a Blob for IndexedDB
      try {
        const response = await fetch(url, { mode: "cors" });
        if (response.ok) {
          const blob = await response.blob();
          // Store in CacheStorage for Service Worker matching
          const synthResponse = new Response(blob, {
            status: 200,
            headers: {
              "Content-Type": blob.type || "image/jpeg",
              "Cache-Control": "public, max-age=31536000",
            },
          });
          await saveToCacheStorage(url, synthResponse);

          // Store in IndexedDB
          await saveToIDB(url, blob);

          const objectUrl = createSafeObjectUrl(blob);
          if (objectUrl) {
            inMemoryObjectUrls.set(url, objectUrl);
            return objectUrl;
          }
          return url;
        }
      } catch {
        // CORS failed (e.g. cross-origin restrictions or network issue)
      }

      // 2. Fallback: try no-cors fetch to preserve in Cache Storage
      try {
        const opaqueResponse = await fetch(url, { mode: "no-cors" });
        if (opaqueResponse.ok || opaqueResponse.type === "opaque") {
          await saveToCacheStorage(url, opaqueResponse);
        }
      } catch {
        // Device is offline or request failed
      }

      // Re-check cache in case ServiceWorker had it
      const fallbackCached = await getCachedPosterUrl(url);
      return fallbackCached;
    } finally {
      inflightFetches.delete(url);
    }
  })();

  inflightFetches.set(url, fetchPromise);
  return fetchPromise;
};

/**
 * Pre-caches all movie poster images in the user's watchlist.
 * Resolves each movie's poster (custom poster, standard poster, or fallback cat poster)
 * and downloads/persists them locally so the watchlist is visually complete offline.
 */
export const cacheWatchlistPosters = async (
  movies: Array<{
    id?: string;
    title?: string;
    posterUrl?: string | null;
    customPosterUrl?: string | null;
  }>,
  concurrency = 4
): Promise<void> => {
  if (!movies || movies.length === 0) return;

  // Extract all poster URLs (including cat fallback posters for movies lacking official art)
  const posterUrls: string[] = [];
  for (const movie of movies) {
    const rawUrl = movie.customPosterUrl || movie.posterUrl;
    const resolvedUrl = rawUrl && isValidPosterUrl(rawUrl)
      ? rawUrl
      : getCatPosterUrl(movie.id || movie.title);

    if (isValidPosterUrl(resolvedUrl)) {
      posterUrls.push(resolvedUrl);
    }
  }

  const uniqueUrls = Array.from(new Set(posterUrls));
  if (uniqueUrls.length === 0) return;

  // Warm the Service Worker media cache
  warmServiceWorkerMedia(uniqueUrls);

  // Download and cache into IndexedDB + Cache Storage with controlled concurrency
  const queue = [...uniqueUrls];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const nextUrl = queue.shift();
      if (nextUrl) {
        try {
          await cachePosterLocally(nextUrl);
        } catch {
          // Continue caching remaining posters
        }
      }
    }
  });

  await Promise.all(workers);
};

/**
 * Resets local in-memory poster cache and clears storage (for testing and cache reset).
 */
export const clearPosterCache = async (): Promise<void> => {
  if (typeof window !== "undefined" && typeof window.URL !== "undefined" && typeof window.URL.revokeObjectURL === "function") {
    for (const objectUrl of inMemoryObjectUrls.values()) {
      if (objectUrl.startsWith("blob:")) {
        try {
          window.URL.revokeObjectURL(objectUrl);
        } catch {
          // Ignore
        }
      }
    }
  }
  inMemoryObjectUrls.clear();
  inflightFetches.clear();

  const db = await getPosterDB();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(POSTER_IDB_STORE, "readwrite");
        const store = tx.objectStore(POSTER_IDB_STORE);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      await window.caches.delete(MEDIA_CACHE_NAME);
    } catch {
      // Ignore
    }
  }
};
