import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStremioSearchUrl,
  buildStremioDetailUrl,
  getStremioUrls,
  normalizeImdbId,
  toStremioType,
} from "./stremio";

describe("stremio utilities", () => {
  describe("buildStremioSearchUrl", () => {
    it("returns the Stremio app root for an empty or whitespace query", () => {
      assert.strictEqual(buildStremioSearchUrl(""), "stremio:///");
      assert.strictEqual(buildStremioSearchUrl("   "), "stremio:///");
    });

    it("uses the three-slash search route with an encoded query", () => {
      assert.strictEqual(buildStremioSearchUrl("Inception"), "stremio:///search?search=Inception");
      assert.strictEqual(buildStremioSearchUrl("  Breaking Bad  "), "stremio:///search?search=Breaking%20Bad");
      assert.strictEqual(
        buildStremioSearchUrl("Spider-Man: Into the Spider-Verse & More"),
        "stremio:///search?search=Spider-Man%3A%20Into%20the%20Spider-Verse%20%26%20More",
      );
      assert.strictEqual(buildStremioSearchUrl("   Amélie 🎬   "), "stremio:///search?search=Am%C3%A9lie%20%F0%9F%8E%AC");
    });
  });

  describe("normalizeImdbId", () => {
    it("accepts only real IMDb title ids", () => {
      assert.strictEqual(normalizeImdbId(" tt0133093 "), "tt0133093");
      assert.strictEqual(normalizeImdbId("TT15239678"), "tt15239678");
      for (const bad of [undefined, null, "", "   ", "tv-123", "0133093", "tt", "N/A"]) {
        assert.strictEqual(normalizeImdbId(bad), null, String(bad));
      }
    });
  });

  describe("toStremioType", () => {
    it("maps every TV spelling to series and everything else to movie", () => {
      for (const value of ["series", "tv", "TV", "show", "tvshow", "TV Series", "tv-series"]) {
        assert.strictEqual(toStremioType(value), "series", value);
      }
      for (const value of [undefined, "", "movie", "documentary", "youtube"]) {
        assert.strictEqual(toStremioType(value), "movie", String(value));
      }
      assert.strictEqual(toStremioType(undefined, "TV Series"), "series");
    });
  });

  describe("buildStremioDetailUrl", () => {
    it("returns null without a valid IMDb id", () => {
      assert.strictEqual(buildStremioDetailUrl("movie"), null);
      assert.strictEqual(buildStremioDetailUrl("movie", null), null);
      assert.strictEqual(buildStremioDetailUrl("series", "   "), null);
      assert.strictEqual(buildStremioDetailUrl("series", "tv-82"), null);
    });

    it("opens a movie's streams and a series' episode list, with three slashes", () => {
      assert.strictEqual(buildStremioDetailUrl("movie", "tt1375666"), "stremio:///detail/movie/tt1375666/tt1375666");
      assert.strictEqual(buildStremioDetailUrl("series", "  tt0903747  "), "stremio:///detail/series/tt0903747");
    });
  });

  describe("getStremioUrls", () => {
    it("opens the title directly when an IMDb id is known", () => {
      assert.deepStrictEqual(getStremioUrls("Inception", "movie", "tt1375666"), {
        detailUrl: "stremio:///detail/movie/tt1375666/tt1375666",
        searchUrl: "stremio:///search?search=Inception",
        appUrl: "stremio:///detail/movie/tt1375666/tt1375666",
        hasDirectImdbMatch: true,
      });
      assert.deepStrictEqual(getStremioUrls({ title: "Stranger Things", mediaType: "series", imdbId: "tt4574334" }), {
        detailUrl: "stremio:///detail/series/tt4574334",
        searchUrl: "stremio:///search?search=Stranger%20Things",
        appUrl: "stremio:///detail/series/tt4574334",
        hasDirectImdbMatch: true,
      });
    });

    it("falls back to search when there is no IMDb id", () => {
      assert.deepStrictEqual(getStremioUrls("Inception"), {
        detailUrl: null,
        searchUrl: "stremio:///search?search=Inception",
        appUrl: "stremio:///search?search=Inception",
        hasDirectImdbMatch: false,
      });
      assert.strictEqual(getStremioUrls({ title: "Unknown Show", type: "series" }).appUrl, "stremio:///search?search=Unknown%20Show");
      assert.strictEqual(getStremioUrls({ title: "Some Show", type: "series", imdbID: "tv-12" }).appUrl, "stremio:///search?search=Some%20Show");
      assert.strictEqual(getStremioUrls("").appUrl, "stremio:///");
    });

    it("reads the type from mediaType, type, or a TV category", () => {
      assert.strictEqual(getStremioUrls({ title: "A", mediaType: "series", type: "movie", imdbID: "tt1234567" }).appUrl, "stremio:///detail/series/tt1234567");
      assert.strictEqual(getStremioUrls({ title: "B", type: "tv", imdbID: "tt1234567" }).appUrl, "stremio:///detail/series/tt1234567");
      assert.strictEqual(getStremioUrls({ title: "C", category: "TV Series", imdbID: "tt1234567" }).appUrl, "stremio:///detail/series/tt1234567");
      assert.strictEqual(getStremioUrls({ title: "D", mediaType: "documentary", imdbID: "tt9999999" }).appUrl, "stremio:///detail/movie/tt9999999/tt9999999");
      assert.strictEqual(getStremioUrls({ title: "E", imdbID: "tt1111111", imdbId: "tt2222222" }).detailUrl, "stremio:///detail/movie/tt1111111/tt1111111");
    });
  });
});
