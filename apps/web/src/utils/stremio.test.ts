import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStremioSearchUrl,
  buildStremioDetailUrl,
  getStremioUrls,
} from "./stremio";

describe("stremio utilities", () => {
  describe("buildStremioSearchUrl", () => {
    it("returns default stremio protocol string for empty or whitespace query", () => {
      assert.strictEqual(buildStremioSearchUrl(""), "stremio://");
      assert.strictEqual(buildStremioSearchUrl("   "), "stremio://");
    });

    it("returns formatted search URL for valid queries", () => {
      assert.strictEqual(
        buildStremioSearchUrl("Inception"),
        "stremio://search?search=Inception",
      );
      assert.strictEqual(
        buildStremioSearchUrl("  Breaking Bad  "),
        "stremio://search?search=Breaking%20Bad",
      );
    });

    it("properly URI encodes special characters", () => {
      assert.strictEqual(
        buildStremioSearchUrl("Spider-Man: Into the Spider-Verse & More"),
        "stremio://search?search=Spider-Man%3A%20Into%20the%20Spider-Verse%20%26%20More",
      );
    });
  });

  describe("buildStremioDetailUrl", () => {
    it("returns null if imdbId is missing, empty, or whitespace", () => {
      assert.strictEqual(buildStremioDetailUrl("movie"), null);
      assert.strictEqual(buildStremioDetailUrl("movie", null), null);
      assert.strictEqual(buildStremioDetailUrl("movie", ""), null);
      assert.strictEqual(buildStremioDetailUrl("series", "   "), null);
    });

    it("returns correctly formatted detail URL for movies and series", () => {
      assert.strictEqual(
        buildStremioDetailUrl("movie", "tt1375666"),
        "stremio://detail/movie/tt1375666",
      );
      assert.strictEqual(
        buildStremioDetailUrl("series", "  tt0903747  "),
        "stremio://detail/series/tt0903747",
      );
    });
  });

  describe("getStremioUrls", () => {
    it("handles string target with default and explicit parameters", () => {
      const resultDefault = getStremioUrls("Inception");
      assert.deepStrictEqual(resultDefault, {
        detailUrl: null,
        searchUrl: "stremio://search?search=Inception",
        appUrl: "stremio://search?search=Inception",
        hasDirectImdbMatch: false,
      });

      const resultWithImdb = getStremioUrls("Inception", "movie", "tt1375666");
      assert.deepStrictEqual(resultWithImdb, {
        detailUrl: "stremio://detail/movie/tt1375666",
        searchUrl: "stremio://search?search=Inception",
        appUrl: "stremio://search?search=Inception",
        hasDirectImdbMatch: true,
      });

      const resultSeries = getStremioUrls("Breaking Bad", "series", "tt0903747");
      assert.deepStrictEqual(resultSeries, {
        detailUrl: "stremio://detail/series/tt0903747",
        searchUrl: "stremio://search?search=Breaking%20Bad",
        appUrl: "stremio://search?search=Breaking%20Bad",
        hasDirectImdbMatch: true,
      });
    });

    it("handles media object target with title, mediaType/type, and imdbID/imdbId", () => {
      const obj1 = {
        title: "The Matrix",
        type: "movie",
        imdbID: "tt0133093",
      };
      assert.deepStrictEqual(getStremioUrls(obj1), {
        detailUrl: "stremio://detail/movie/tt0133093",
        searchUrl: "stremio://search?search=The%20Matrix",
        appUrl: "stremio://search?search=The%20Matrix",
        hasDirectImdbMatch: true,
      });

      const obj2 = {
        title: "Stranger Things",
        mediaType: "series",
        imdbId: "tt4574334",
      };
      assert.deepStrictEqual(getStremioUrls(obj2), {
        detailUrl: "stremio://detail/series/tt4574334",
        searchUrl: "stremio://search?search=Stranger%20Things",
        appUrl: "stremio://search?search=Stranger%20Things",
        hasDirectImdbMatch: true,
      });

      const objNoImdb = {
        title: "Unknown Show",
        type: "series",
      };
      assert.deepStrictEqual(getStremioUrls(objNoImdb), {
        detailUrl: null,
        searchUrl: "stremio://search?search=Unknown%20Show",
        appUrl: "stremio://search?search=Unknown%20Show",
        hasDirectImdbMatch: false,
      });
    });
  });
});
