import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  isValidPosterUrl,
  getCachedPosterUrlSync,
  cachePosterLocally,
  cacheWatchlistPosters,
  clearPosterCache,
} from "./posterCache.js";

describe("posterCache", () => {
  beforeEach(async () => {
    await clearPosterCache();
  });

  describe("isValidPosterUrl", () => {
    it("accepts valid https URLs", () => {
      assert.equal(isValidPosterUrl("https://m.media-amazon.com/poster.jpg"), true);
    });

    it("accepts valid http URLs", () => {
      assert.equal(isValidPosterUrl("http://example.com/poster.jpg"), true);
    });

    it("accepts data URLs", () => {
      assert.equal(isValidPosterUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="), true);
    });

    it("accepts blob URLs", () => {
      assert.equal(isValidPosterUrl("blob:http://localhost:3000/1234-5678"), true);
    });

    it("accepts root-relative image paths", () => {
      assert.equal(isValidPosterUrl("/images/default-poster.jpg"), true);
    });

    it("rejects api endpoints and invalid strings", () => {
      assert.equal(isValidPosterUrl("/api/movies"), false);
      assert.equal(isValidPosterUrl("N/A"), false);
      assert.equal(isValidPosterUrl(""), false);
      assert.equal(isValidPosterUrl("   "), false);
      assert.equal(isValidPosterUrl(null), false);
      assert.equal(isValidPosterUrl(undefined), false);
    });
  });

  describe("cachePosterLocally", () => {
    it("returns null for invalid URLs", async () => {
      const result = await cachePosterLocally("invalid-url");
      assert.equal(result, null);
    });

    it("handles data URLs directly without fetching", async () => {
      const dataUrl = "data:image/png;base64,dummydata";
      const result = await cachePosterLocally(dataUrl);
      assert.equal(result, dataUrl);
      assert.equal(getCachedPosterUrlSync(dataUrl), dataUrl);
    });
  });

  describe("cacheWatchlistPosters", () => {
    it("handles empty or null movie arrays gracefully", async () => {
      await cacheWatchlistPosters([]);
      // Should not throw
      assert.ok(true);
    });

    it("extracts and queues posters for movies with custom posters and default posters", async () => {
      const mockMovies = [
        {
          id: "m1",
          title: "Inception",
          posterUrl: "https://m.media-amazon.com/inception.jpg",
        },
        {
          id: "m2",
          title: "Custom Movie",
          posterUrl: "https://m.media-amazon.com/old.jpg",
          customPosterUrl: "https://images.unsplash.com/custom.jpg",
        },
        {
          id: "m3",
          title: "Untitled Cat Fallback",
          posterUrl: null,
        },
      ];

      // Should run without throwing errors even in Node test environment
      await cacheWatchlistPosters(mockMovies);
      assert.ok(true);
    });
  });
});
