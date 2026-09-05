import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  storeImageBlob,
  getImageBlob,
  deleteImageBlob,
  clearImageCache,
  cleanupOldImages,
  THIRTY_DAYS_MS,
  imageCache,
} from "./imageCache.js";

describe("imageCache utility (IndexedDB poster cache)", () => {
  beforeEach(async () => {
    await clearImageCache();
  });

  it("stores and retrieves a movie poster blob", async () => {
    const testUrl = "https://m.media-amazon.com/poster.jpg";
    const sampleBlob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });

    // Initially not in cache
    const initial = await getImageBlob(testUrl);
    assert.equal(initial, null);

    // Store blob in cache
    await storeImageBlob(testUrl, sampleBlob);

    // Retrieve blob from cache
    const cached = await getImageBlob(testUrl);
    assert.ok(cached instanceof Blob);
    assert.equal(cached.size, sampleBlob.size);
    assert.equal(cached.type, "image/jpeg");
  });

  it("deletes a cached image blob by URL", async () => {
    const testUrl = "https://m.media-amazon.com/poster2.jpg";
    const sampleBlob = new Blob(["another-poster"], { type: "image/png" });

    await storeImageBlob(testUrl, sampleBlob);
    const before = await getImageBlob(testUrl);
    assert.ok(before instanceof Blob);

    await deleteImageBlob(testUrl);
    const after = await getImageBlob(testUrl);
    assert.equal(after, null);
  });

  it("clears all cached images", async () => {
    const url1 = "https://example.com/p1.jpg";
    const url2 = "https://example.com/p2.jpg";
    await storeImageBlob(url1, new Blob(["1"]));
    await storeImageBlob(url2, new Blob(["2"]));

    assert.ok(await getImageBlob(url1));
    assert.ok(await getImageBlob(url2));

    await clearImageCache();

    assert.equal(await getImageBlob(url1), null);
    assert.equal(await getImageBlob(url2), null);
  });

  it("exposes convenient aliases on the imageCache export", async () => {
    assert.equal(THIRTY_DAYS_MS, 30 * 24 * 60 * 60 * 1000);
    const testUrl = "https://example.com/poster-alias.jpg";
    const blob = new Blob(["alias-test"], { type: "image/webp" });

    await imageCache.saveImage(testUrl, blob);
    const retrieved = await imageCache.getImage(testUrl);
    assert.ok(retrieved instanceof Blob);
    assert.equal(retrieved.type, "image/webp");

    const cachedFromAlias = await imageCache.getCachedImage(testUrl);
    assert.ok(cachedFromAlias instanceof Blob);

    await imageCache.deleteImage(testUrl);
    assert.equal(await imageCache.getImage(testUrl), null);
  });

  it("handles null or empty URLs gracefully", async () => {
    assert.equal(await getImageBlob(""), null);
    // @ts-expect-error test invalid parameter
    await storeImageBlob("", null);
    assert.equal(await getImageBlob(""), null);
  });

  it("removes movie poster blobs older than 30 days while preserving recent ones", async () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Poster cached 35 days ago (should be purged)
    const oldUrl = "https://example.com/old-poster.jpg";
    const oldBlob = new Blob(["old-poster-data"], { type: "image/jpeg" });
    await storeImageBlob(oldUrl, oldBlob, now - (35 * oneDayMs));

    // Poster cached 10 days ago (should be kept)
    const recentUrl = "https://example.com/recent-poster.jpg";
    const recentBlob = new Blob(["recent-poster-data"], { type: "image/jpeg" });
    await storeImageBlob(recentUrl, recentBlob, now - (10 * oneDayMs));

    // Poster cached just now (should be kept)
    const brandNewUrl = "https://example.com/new-poster.jpg";
    const brandNewBlob = new Blob(["brand-new-data"], { type: "image/jpeg" });
    await storeImageBlob(brandNewUrl, brandNewBlob, now);

    // Verify all 3 are initially present
    assert.ok(await getImageBlob(oldUrl));
    assert.ok(await getImageBlob(recentUrl));
    assert.ok(await getImageBlob(brandNewUrl));

    // Run cleanup with default 30 days
    const deletedCount = await cleanupOldImages();
    assert.equal(deletedCount, 1);

    // Old poster should be removed
    assert.equal(await getImageBlob(oldUrl), null);

    // Recent and brand new posters should still exist
    const preservedRecent = await getImageBlob(recentUrl);
    assert.ok(preservedRecent instanceof Blob);
    assert.equal(preservedRecent.size, recentBlob.size);

    const preservedNew = await getImageBlob(brandNewUrl);
    assert.ok(preservedNew instanceof Blob);
    assert.equal(preservedNew.size, brandNewBlob.size);
  });

  it("supports custom maxAgeMs parameter and cleanup aliases", async () => {
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;

    const expiredUrl = "https://example.com/expired-2hours.jpg";
    await storeImageBlob(expiredUrl, new Blob(["expired"]), now - (2 * oneHourMs));

    const activeUrl = "https://example.com/active-30min.jpg";
    await storeImageBlob(activeUrl, new Blob(["active"]), now - (30 * 60 * 1000));

    // Clean up anything older than 1 hour using imageCache.cleanupOldImages
    const removed = await imageCache.cleanupOldImages(oneHourMs);
    assert.equal(removed, 1);
    assert.equal(await getImageBlob(expiredUrl), null);
    assert.ok(await getImageBlob(activeUrl));

    // Clean up remainder using alias cleanupExpiredImages
    const remainingRemoved = await imageCache.cleanupExpiredImages(10 * 1000);
    assert.equal(remainingRemoved, 1);
    assert.equal(await getImageBlob(activeUrl), null);
  });
});
