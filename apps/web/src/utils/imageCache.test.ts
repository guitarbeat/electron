import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  storeImageBlob,
  getImageBlob,
  deleteImageBlob,
  clearImageCache,
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
});
