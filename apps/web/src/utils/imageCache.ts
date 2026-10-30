export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface CachedImageEntry {
  blob: Blob;
  timestamp: number;
}

const memoryStore = new Map<string, CachedImageEntry>();

export async function storeImageBlob(
  url: string,
  blob: Blob,
  timestamp: number = Date.now(),
): Promise<void> {
  if (!url || !blob) return;
  memoryStore.set(url, { blob, timestamp });
}

export async function getImageBlob(url: string): Promise<Blob | null> {
  if (!url) return null;
  const entry = memoryStore.get(url);
  return entry ? entry.blob : null;
}

export async function deleteImageBlob(url: string): Promise<void> {
  if (!url) return;
  memoryStore.delete(url);
}

export async function clearImageCache(): Promise<void> {
  memoryStore.clear();
}

export async function cleanupOldImages(maxAgeMs: number = THIRTY_DAYS_MS): Promise<number> {
  const now = Date.now();
  let deletedCount = 0;
  for (const [url, entry] of memoryStore.entries()) {
    if (now - entry.timestamp > maxAgeMs) {
      memoryStore.delete(url);
      deletedCount++;
    }
  }
  return deletedCount;
}

export const imageCache = {
  saveImage: storeImageBlob,
  getImage: getImageBlob,
  getCachedImage: getImageBlob,
  deleteImage: deleteImageBlob,
  clearImageCache,
  cleanupOldImages,
  cleanupExpiredImages: cleanupOldImages,
};

export default imageCache;
