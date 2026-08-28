/**
 * Cat Poster Fallback Utility using The Cat API
 * Automatically provides cute cat images for any movie that does not have an official poster.
 */

// A rich pool of static high-resolution cat photos from The Cat API (cdn2.thecatapi.com)
export const CAT_API_POSTERS: readonly string[] = [
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/DTcYhC380.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/98d.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/_GVSjXZ4i.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/ack.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/ac2.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/2es.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/u2.png",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/MTUzNzkyNw.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/44c.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/4ml.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/IOqJ6RK7L.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/cw18Op1Ok.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/ci0.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/8h5.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/biq.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/cl7.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/zmG5D_Xne.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/e03.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/c9j.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/bj6.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/a8o.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/7ep.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/Pqcy8pOZG.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/50o.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/29f.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/bae.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/7dj.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/ck3.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/7ak.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/bhi.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/d33.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/23q.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/pm.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/5fj.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/cd3.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/5rr.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/cnp.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/cee.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/dLrzJVXo1.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/0iSghgPeZ.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/btf.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/c9i.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/99c.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/5lr.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/5n3.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/9f1.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/a5a.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/iapoHxQxL.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/MTc5MTcxMQ.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/b38.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/p2U4ZXgKL.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/a6q.jpg",
  "https://s3.us-west-2.amazonaws.com/cdn2.thecatapi.com/images/lJHXU7DlQ.jpg"
];

// In-memory dynamic cache from live The Cat API requests
let dynamicCatPool: string[] = [...CAT_API_POSTERS];
let isFetchingMoreCats = false;

/**
 * Fetch fresh cat images from The Cat API in the background to augment the pool
 */
export const prefetchCatPosters = async (): Promise<void> => {
  if (isFetchingMoreCats || typeof fetch === "undefined") return;
  isFetchingMoreCats = true;
  try {
    const res = await fetch("https://api.thecatapi.com/v1/images/search?limit=10");
    if (!res.ok) return;
    const items = (await res.json()) as Array<{ url?: string }>;
    const newUrls = items
      .map((it) => it.url)
      .filter((url): url is string => typeof url === "string" && !url.endsWith(".gif"));
    if (newUrls.length > 0) {
      dynamicCatPool = Array.from(new Set([...dynamicCatPool, ...newUrls]));
    }
  } catch {
    // Graceful fallback to static pool
  } finally {
    isFetchingMoreCats = false;
  }
};

/**
 * Returns a stable, deterministic cat poster URL for any identifier (movie title, id, or seed).
 */
export const getCatPosterUrl = (identifier?: string): string => {
  const pool = dynamicCatPool.length > 0 ? dynamicCatPool : CAT_API_POSTERS;
  if (!identifier) {
    return pool[0];
  }

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
};

/**
 * Resolves a poster URL, defaulting to a Cat API cat image if missing, invalid, or "N/A"
 */
export const resolvePosterUrl = (
  posterUrl?: string | null,
  identifier?: string
): string => {
  if (
    posterUrl &&
    typeof posterUrl === "string" &&
    posterUrl.trim() !== "" &&
    posterUrl.trim() !== "N/A" &&
    (posterUrl.startsWith("http://") ||
      posterUrl.startsWith("https://") ||
      posterUrl.startsWith("data:") ||
      posterUrl.startsWith("/"))
  ) {
    return posterUrl;
  }
  return getCatPosterUrl(identifier);
};
