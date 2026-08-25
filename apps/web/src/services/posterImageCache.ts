/**
 * High-performance multi-tier poster and media image cache.
 *
 * Tier 1: In-memory Blob URL and load-state cache (0ms instant synchronous resolution)
 * Tier 2: Persistent browser CacheStorage API ('posters-v1') across reloads & sessions
 * Tier 3: Asynchronous background preloader with image pre-decoding and concurrency control
 */

const CACHE_NAME = "movie-posters-v1";
const MAX_MEMORY_BLOBS = 150;

// In-memory lookup maps
const memoryBlobUrls = new Map<string, string>();
const loadedUrlSet = new Set<string>();
const failedUrlSet = new Set<string>();
const inflightPromises = new Map<string, Promise<string>>();

/**
 * Check if the CacheStorage API is available in the current browser environment.
 */
const isCacheStorageAvailable = (): boolean => {
  return (
    typeof window !== "undefined" &&
    typeof window.caches !== "undefined" &&
    typeof window.caches.open === "function"
  );
};

/**
 * Check synchronously if a poster is already loaded/cached in memory.
 */
export const isPosterInMemory = (url?: string): boolean => {
  if (!url) return false;
  return loadedUrlSet.has(url) || memoryBlobUrls.has(url);
};

/**
 * Get synchronous memory cached URL (either a blob: URL or original if confirmed loaded).
 */
export const getSynchronousPosterUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  return memoryBlobUrls.get(url) || url;
};

/**
 * Mark a poster URL as successfully loaded in memory.
 */
export const markPosterLoaded = (url: string) => {
  if (!url) return;
  loadedUrlSet.add(url);
  failedUrlSet.delete(url);
};

/**
 * Mark a poster URL as failed/broken.
 */
export const markPosterFailed = (url: string) => {
  if (!url) return;
  failedUrlSet.add(url);
  loadedUrlSet.delete(url);
  const existingBlob = memoryBlobUrls.get(url);
  if (existingBlob && existingBlob.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(existingBlob);
    } catch {
      // Ignore revoke errors
    }
    memoryBlobUrls.delete(url);
  }
};

/**
 * Check if a URL has failed/broken previously.
 */
export const isPosterFailed = (url?: string): boolean => {
  if (!url) return false;
  return failedUrlSet.has(url);
};

/**
 * Evict oldest memory blob URLs when limit is reached.
 */
const trimMemoryBlobCache = () => {
  while (memoryBlobUrls.size > MAX_MEMORY_BLOBS) {
    const oldestKey = memoryBlobUrls.keys().next().value;
    if (!oldestKey) break;
    const blobUrl = memoryBlobUrls.get(oldestKey);
    if (blobUrl && blobUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Ignore revoke errors
      }
    }
    memoryBlobUrls.delete(oldestKey);
  }
};

/**
 * Pre-decode an image element off the main thread for smooth 60fps rendering.
 */
const decodeImage = async (src: string): Promise<void> => {
  if (typeof window === "undefined" || typeof Image === "undefined") return;
  try {
    const img = new Image();
    img.src = src;
    if ("decode" in img && typeof img.decode === "function") {
      await img.decode();
    }
  } catch {
    // Decoding failure is non-fatal; the browser will fall back to normal rendering
  }
};

/**
 * Fetch and cache an individual poster image.
 * Uses CacheStorage if available, otherwise falls back to preloading via HTMLImageElement.
 */
export const cachePosterImage = async (url: string): Promise<string> => {
  if (!url || typeof window === "undefined") return url;
  if (failedUrlSet.has(url)) return url;

  // 1. Check memory cache
  const cachedBlob = memoryBlobUrls.get(url);
  if (cachedBlob) {
    loadedUrlSet.add(url);
    return cachedBlob;
  }

  // 2. Check inflight deduplication
  const existingPromise = inflightPromises.get(url);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    try {
      // 3. Check persistent CacheStorage
      if (isCacheStorageAvailable()) {
        try {
          const cache = await window.caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(url);
          if (cachedResponse && cachedResponse.ok) {
            const blob = await cachedResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            memoryBlobUrls.set(url, blobUrl);
            trimMemoryBlobCache();
            loadedUrlSet.add(url);
            await decodeImage(blobUrl);
            return blobUrl;
          }
        } catch {
          // CacheStorage read failed; fallback to network
        }
      }

      // 4. Try network fetch with CORS for CacheStorage caching
      try {
        const response = await fetch(url, { mode: "cors", cache: "force-cache" });
        if (response.ok) {
          const clonedResponse = response.clone();
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          memoryBlobUrls.set(url, blobUrl);
          trimMemoryBlobCache();
          loadedUrlSet.add(url);

          // Asynchronously save into persistent CacheStorage
          if (isCacheStorageAvailable()) {
            window.caches.open(CACHE_NAME).then((cache) => {
              cache.put(url, clonedResponse).catch(() => {});
            }).catch(() => {});
          }

          await decodeImage(blobUrl);
          return blobUrl;
        }
      } catch {
        // Fetch failed (likely due to CORS on external CDNs) -> fallback to Image element preloader
      }

      // 5. Fallback: Image preloader (handles cross-origin images without CORS headers)
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          loadedUrlSet.add(url);
          if ("decode" in img && typeof img.decode === "function") {
            img.decode().catch(() => {}).finally(() => resolve());
          } else {
            resolve();
          }
        };
        img.onerror = () => {
          failedUrlSet.add(url);
          reject(new Error(`Failed to load image: ${url}`));
        };
        img.src = url;
      });

      return url;
    } catch {
      // Return original url on failure
      return url;
    } finally {
      inflightPromises.delete(url);
    }
  })();

  inflightPromises.set(url, promise);
  return promise;
};

/**
 * Preload multiple poster images in background with controlled concurrency.
 */
export const preloadPosterImages = (
  urls: (string | undefined | null)[],
  maxConcurrent = 4,
): void => {
  if (typeof window === "undefined" || !urls.length) return;

  const validUrls = Array.from(
    new Set(
      urls.filter(
        (u): u is string =>
          Boolean(u) &&
          typeof u === "string" &&
          u.startsWith("http") &&
          !failedUrlSet.has(u) &&
          !loadedUrlSet.has(u),
      ),
    ),
  );

  if (!validUrls.length) return;

  const queue = [...validUrls];
  let activeCount = 0;

  const processNext = () => {
    while (activeCount < maxConcurrent && queue.length > 0) {
      const nextUrl = queue.shift();
      if (!nextUrl) break;

      activeCount++;
      cachePosterImage(nextUrl)
        .catch(() => {})
        .finally(() => {
          activeCount--;
          processNext();
        });
    }
  };

  // Schedule in next idle period or tick to not block UI rendering
  if ("requestIdleCallback" in window && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => processNext(), { timeout: 1000 });
  } else {
    setTimeout(processNext, 50);
  }
};

/**
 * React hook to get a cached poster URL and loading state.
 */
import { useState, useEffect } from "react";

export interface UseCachedPosterResult {
  src: string | undefined;
  isLoaded: boolean;
  hasError: boolean;
}

export const useCachedPoster = (posterUrl?: string): UseCachedPosterResult => {
  const isInitiallyLoaded = Boolean(posterUrl && isPosterInMemory(posterUrl));
  const isInitiallyFailed = Boolean(posterUrl && isPosterFailed(posterUrl));

  const [src, setSrc] = useState<string | undefined>(() =>
    posterUrl ? getSynchronousPosterUrl(posterUrl) : undefined,
  );
  const [isLoaded, setIsLoaded] = useState<boolean>(isInitiallyLoaded);
  const [hasError, setHasError] = useState<boolean>(isInitiallyFailed);

  useEffect(() => {
    if (!posterUrl) {
      setSrc(undefined);
      setIsLoaded(false);
      setHasError(false);
      return;
    }

    if (isPosterFailed(posterUrl)) {
      setHasError(true);
      setIsLoaded(true);
      return;
    }

    if (isPosterInMemory(posterUrl)) {
      setSrc(getSynchronousPosterUrl(posterUrl));
      setIsLoaded(true);
      setHasError(false);
      return;
    }

    let isMounted = true;
    setHasError(false);
    setIsLoaded(false);

    cachePosterImage(posterUrl)
      .then((resolvedUrl) => {
        if (!isMounted) return;
        setSrc(resolvedUrl);
        setIsLoaded(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setHasError(true);
        setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [posterUrl]);

  return { src: src || posterUrl, isLoaded, hasError };
};
