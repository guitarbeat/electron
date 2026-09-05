/**
 * Utility using IndexedDB to store and retrieve movie poster blobs locally.
 * Checks local cache before fetching from network, ensuring instant loads and offline resilience.
 */

export const DB_NAME = "movie_image_cache";
export const STORE_NAME = "posters";
export const DB_VERSION = 2;

/**
 * 30 days in milliseconds
 */
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export const DEFAULT_MAX_IMAGE_AGE_MS = THIRTY_DAYS_MS;

export interface CachedImageRecord {
  url: string;
  blob: Blob;
  mimeType?: string;
  timestamp: number;
}

// In-memory object URL cache to avoid re-creating object URLs repeatedly
const objectUrlMemoryCache = new Map<string, string>();

// Fallback in-memory store for environments without native IndexedDB (e.g. Node test environment)
const memoryFallbackStore = new Map<string, CachedImageRecord>();

// Ongoing network fetches deduplicated by URL
const pendingFetches = new Map<string, Promise<Blob | null>>();

let dbInstancePromise: Promise<IDBDatabase | null> | null = null;

/**
 * Open or initialize the IndexedDB database
 */
export const openImageDatabase = (): Promise<IDBDatabase | null> => {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  dbInstancePromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        let store: IDBObjectStore;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          store = db.createObjectStore(STORE_NAME, { keyPath: "url" });
        } else {
          store = request.transaction!.objectStore(STORE_NAME);
        }
        if (!store.indexNames.contains("timestamp")) {
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn("[imageCache] Failed to open IndexedDB:", request.error);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn("[imageCache] IndexedDB open blocked");
        resolve(null);
      };
    } catch (err) {
      console.warn("[imageCache] Error initializing IndexedDB:", err);
      resolve(null);
    }
  });

  return dbInstancePromise;
};

/**
 * Stores a movie poster blob in IndexedDB
 */
export const storeImageBlob = async (
  url: string | null | undefined,
  blob: Blob,
  timestampOverride?: number,
): Promise<void> => {
  if (!url || !(blob instanceof Blob)) return;

  const record: CachedImageRecord = {
    url,
    blob,
    mimeType: blob.type || "image/jpeg",
    timestamp: typeof timestampOverride === "number" ? timestampOverride : Date.now(),
  };

  const db = await openImageDatabase();
  if (!db) {
    memoryFallbackStore.set(url, record);
    return;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(record);

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        memoryFallbackStore.set(url, record);
        resolve();
      };
      tx.onabort = () => {
        memoryFallbackStore.set(url, record);
        resolve();
      };
    } catch {
      memoryFallbackStore.set(url, record);
      resolve();
    }
  });
};

/**
 * Retrieves a movie poster blob from IndexedDB by URL
 */
export const getImageBlob = async (url: string | null | undefined): Promise<Blob | null> => {
  if (!url) return null;

  const db = await openImageDatabase();
  if (!db) {
    const record = memoryFallbackStore.get(url);
    return record ? record.blob : null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result as CachedImageRecord | undefined;
        if (result && result.blob instanceof Blob) {
          resolve(result.blob);
        } else {
          const memoryRecord = memoryFallbackStore.get(url);
          resolve(memoryRecord ? memoryRecord.blob : null);
        }
      };

      request.onerror = () => {
        const memoryRecord = memoryFallbackStore.get(url);
        resolve(memoryRecord ? memoryRecord.blob : null);
      };
    } catch {
      const memoryRecord = memoryFallbackStore.get(url);
      resolve(memoryRecord ? memoryRecord.blob : null);
    }
  });
};

/**
 * Deletes a cached image record by URL
 */
export const deleteImageBlob = async (url: string | null | undefined): Promise<void> => {
  if (!url) return;

  const objUrl = objectUrlMemoryCache.get(url);
  if (objUrl && typeof window !== "undefined" && typeof window.URL?.revokeObjectURL === "function") {
    try {
      window.URL.revokeObjectURL(objUrl);
    } catch {
      // Ignore revocation error
    }
  }
  objectUrlMemoryCache.delete(url);
  memoryFallbackStore.delete(url);

  const db = await openImageDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(url);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
};

/**
 * Clears all cached images from IndexedDB and memory
 */
export const clearImageCache = async (): Promise<void> => {
  if (typeof window !== "undefined" && typeof window.URL?.revokeObjectURL === "function") {
    for (const objUrl of objectUrlMemoryCache.values()) {
      try {
        window.URL.revokeObjectURL(objUrl);
      } catch {
        // Ignore revocation error
      }
    }
  }
  objectUrlMemoryCache.clear();
  memoryFallbackStore.clear();
  pendingFetches.clear();

  const db = await openImageDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
};

/**
 * Removes movie poster blobs older than the specified max age (default: 30 days) from IndexedDB
 * and in-memory caches to manage storage size effectively.
 *
 * @param maxAgeMs Maximum age in milliseconds before a cached poster is purged (default: 30 days)
 * @returns Promise resolving to the number of purged image records
 */
export const cleanupOldImages = async (
  maxAgeMs: number = DEFAULT_MAX_IMAGE_AGE_MS,
): Promise<number> => {
  const cutoffTime = Date.now() - maxAgeMs;
  let deletedCount = 0;

  // 1. Clean up matching in-memory fallback store entries
  for (const [url, record] of Array.from(memoryFallbackStore.entries())) {
    if (!record?.timestamp || record.timestamp < cutoffTime) {
      const objUrl = objectUrlMemoryCache.get(url);
      if (objUrl && typeof window !== "undefined" && typeof window.URL?.revokeObjectURL === "function") {
        try {
          window.URL.revokeObjectURL(objUrl);
        } catch {
          // Ignore revocation error
        }
      }
      objectUrlMemoryCache.delete(url);
      memoryFallbackStore.delete(url);
      deletedCount++;
    }
  }

  // 2. Clean up expired records from IndexedDB
  const db = await openImageDatabase();
  if (!db) {
    return deletedCount;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          const record = cursor.value as CachedImageRecord;
          if (!record?.timestamp || record.timestamp < cutoffTime) {
            const url = record?.url || (cursor.key as string);
            const objUrl = objectUrlMemoryCache.get(url);
            if (objUrl && typeof window !== "undefined" && typeof window.URL?.revokeObjectURL === "function") {
              try {
                window.URL.revokeObjectURL(objUrl);
              } catch {
                // Ignore revocation error
              }
            }
            objectUrlMemoryCache.delete(url);
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(deletedCount);
      tx.onerror = () => resolve(deletedCount);
      tx.onabort = () => resolve(deletedCount);
    } catch {
      resolve(deletedCount);
    }
  });
};

/**
 * Helper to check if an in-memory object URL already exists synchronously
 */
export const getCachedObjectUrlSync = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  return objectUrlMemoryCache.get(url) || null;
};

/**
 * Fetches an image from the network, converts to blob, and caches it in IndexedDB.
 * Deduplicates in-flight fetches for the same URL.
 */
export const fetchAndCacheImage = async (url: string | null | undefined): Promise<Blob | null> => {
  if (!url) return null;

  // If already in cache, return immediately
  const existingBlob = await getImageBlob(url);
  if (existingBlob) return existingBlob;

  if (pendingFetches.has(url)) {
    return pendingFetches.get(url)!;
  }

  const fetchPromise = (async (): Promise<Blob | null> => {
    try {
      if (typeof fetch === "undefined") return null;

      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) return null;

      const blob = await response.blob();
      await storeImageBlob(url, blob);
      return blob;
    } catch {
      return null;
    } finally {
      pendingFetches.delete(url);
    }
  })();

  pendingFetches.set(url, fetchPromise);
  return fetchPromise;
};

/**
 * Loads a poster image URL by checking IndexedDB first before network.
 * Returns an object URL for the cached blob, or fetches from network and caches.
 */
export const getImageObjectUrl = async (url: string | null | undefined): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  // 1. Check in-memory object URL cache
  const memoryObjUrl = objectUrlMemoryCache.get(url);
  if (memoryObjUrl) return memoryObjUrl;

  // 2. Check IndexedDB cache
  const cachedBlob = await getImageBlob(url);
  if (cachedBlob) {
    if (typeof window !== "undefined" && typeof window.URL?.createObjectURL === "function") {
      try {
        const objUrl = window.URL.createObjectURL(cachedBlob);
        objectUrlMemoryCache.set(url, objUrl);
        return objUrl;
      } catch {
        return null;
      }
    }
  }

  // 3. If not in cache, fetch from network and cache
  const fetchedBlob = await fetchAndCacheImage(url);
  if (fetchedBlob) {
    if (typeof window !== "undefined" && typeof window.URL?.createObjectURL === "function") {
      try {
        const objUrl = window.URL.createObjectURL(fetchedBlob);
        objectUrlMemoryCache.set(url, objUrl);
        return objUrl;
      } catch {
        return null;
      }
    }
  }

  return null;
};

// Aliases for consumer flexibility
export const getCachedImage = getImageBlob;
export const cacheImage = storeImageBlob;
export const getImageFromCache = getImageBlob;
export const saveImageToCache = storeImageBlob;
export const getImage = getImageBlob;
export const saveImage = storeImageBlob;
export const deleteImage = deleteImageBlob;
export const clearCache = clearImageCache;
export const cleanOldImages = cleanupOldImages;
export const cleanupExpiredImages = cleanupOldImages;
export const cleanupImageCache = cleanupOldImages;
export const removeOldImages = cleanupOldImages;
export const purgeOldImages = cleanupOldImages;
export const getImageUrl = getImageObjectUrl;
export const loadImageWithCache = getImageObjectUrl;

export const imageCache = {
  openImageDatabase,
  storeImageBlob,
  getImageBlob,
  deleteImageBlob,
  clearImageCache,
  cleanupOldImages,
  cleanOldImages,
  cleanupExpiredImages,
  cleanupImageCache,
  removeOldImages,
  purgeOldImages,
  fetchAndCacheImage,
  getImageObjectUrl,
  getCachedObjectUrlSync,
  getCachedImage,
  cacheImage,
  getImageFromCache,
  saveImageToCache,
  getImage,
  saveImage,
  deleteImage,
  clearCache,
  getImageUrl,
  loadImageWithCache,
};

export default imageCache;
