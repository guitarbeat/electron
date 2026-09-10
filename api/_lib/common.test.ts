import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  KNOWN_USERS,
  USER_OPTIONS,
  MAX_MESSAGE_LENGTH,
  MAX_MOVIE_TITLE_LENGTH,
  isUser,
  parseJsonContent,
  sanitizeInput,
  isValidUrl,
  normalizeMovieTitle,
  findMovieByNormalizedTitle,
  ensureFourDigitPin,
  ensureBoolean,
} from "./common.js";

describe("common utilities", () => {
  describe("constants and user helpers", () => {
    it("exports expected KNOWN_USERS and USER_OPTIONS", () => {
      assert.deepEqual(KNOWN_USERS, ["Aaron", "Electra"]);
      assert.deepEqual(USER_OPTIONS, ["Aaron", "Electra"]);
      assert.equal(USER_OPTIONS, KNOWN_USERS);
    });

    it("exports length constants", () => {
      assert.equal(MAX_MESSAGE_LENGTH, 500);
      assert.equal(MAX_MOVIE_TITLE_LENGTH, 200);
    });

    it("isUser validates known users correctly", () => {
      assert.equal(isUser("Aaron"), true);
      assert.equal(isUser("Electra"), true);
      assert.equal(isUser("Unknown"), false);
      assert.equal(isUser("aaron"), false);
      assert.equal(isUser(""), false);
      assert.equal(isUser(null), false);
      assert.equal(isUser(undefined), false);
      assert.equal(isUser(123), false);
      assert.equal(isUser({}), false);
    });
  });

  describe("parseJsonContent", () => {
    it("parses valid JSON content", () => {
      assert.deepEqual(parseJsonContent('{"key": "value"}', "test context"), { key: "value" });
      assert.deepEqual(parseJsonContent("[1, 2, 3]", "test context"), [1, 2, 3]);
      assert.equal(parseJsonContent('"hello"', "test context"), "hello");
      assert.equal(parseJsonContent("123", "test context"), 123);
      assert.equal(parseJsonContent("true", "test context"), true);
    });

    it("throws descriptive error when JSON parsing fails", () => {
      assert.throws(
        () => parseJsonContent("invalid json", "movie query"),
        (err: unknown) => {
          assert(err instanceof Error);
          assert.match(err.message, /^Failed to parse JSON in movie query:/);
          return true;
        }
      );
    });
  });

  describe("sanitizeInput", () => {
    it("returns empty string for null, undefined, or empty string", () => {
      assert.equal(sanitizeInput(null), "");
      assert.equal(sanitizeInput(undefined), "");
      assert.equal(sanitizeInput(""), "");
    });

    it("removes control characters and trims whitespace", () => {
      const input = " \x00Hello\x07 \x1FWorld!\x7F ";
      assert.equal(sanitizeInput(input), "Hello World!");
    });
  });

  describe("isValidUrl", () => {
    it("returns true for http and https URLs", () => {
      assert.equal(isValidUrl("http://example.com"), true);
      assert.equal(isValidUrl("https://example.com/path?query=1"), true);
    });

    it("returns false for non-http/https URLs or invalid inputs", () => {
      assert.equal(isValidUrl("ftp://example.com"), false);
      assert.equal(isValidUrl("javascript:alert(1)"), false);
      assert.equal(isValidUrl("not a url"), false);
      assert.equal(isValidUrl(""), false);
      assert.equal(isValidUrl(null as unknown as string), false);
      assert.equal(isValidUrl(undefined as unknown as string), false);
    });
  });

  describe("normalizeMovieTitle and findMovieByNormalizedTitle", () => {
    it("normalizes movie title by trimming, lowercasing, and collapsing spaces", () => {
      assert.equal(normalizeMovieTitle("  The   Matrix  "), "the matrix");
      assert.equal(normalizeMovieTitle("INCEPTION"), "inception");
    });

    it("finds movie by normalized title", () => {
      const movies = [
        { title: "The Matrix", id: 1 },
        { title: "Inception", id: 2 },
      ];

      assert.deepEqual(findMovieByNormalizedTitle(movies, "  the   matrix "), { title: "The Matrix", id: 1 });
      assert.deepEqual(findMovieByNormalizedTitle(movies, "INCEPTION"), { title: "Inception", id: 2 });
      assert.equal(findMovieByNormalizedTitle(movies, "Avatar"), undefined);
    });
  });

  describe("ensureFourDigitPin", () => {
    it("returns 4-digit PIN string when input contains 4 digits", () => {
      assert.equal(ensureFourDigitPin("1234"), "1234");
      assert.equal(ensureFourDigitPin("12-34"), "1234");
      assert.equal(ensureFourDigitPin("a1b2c3d4"), "1234");
    });

    it("returns null when input does not yield exactly 4 digits or is not a string", () => {
      assert.equal(ensureFourDigitPin("123"), null);
      assert.equal(ensureFourDigitPin("12345"), null);
      assert.equal(ensureFourDigitPin("abcd"), null);
      assert.equal(ensureFourDigitPin(1234), null);
      assert.equal(ensureFourDigitPin(null), null);
      assert.equal(ensureFourDigitPin(undefined), null);
    });
  });

  describe("ensureBoolean", () => {
    it("returns boolean value for boolean inputs", () => {
      assert.equal(ensureBoolean(true), true);
      assert.equal(ensureBoolean(false), false);
    });

    it("returns null for non-boolean inputs", () => {
      assert.equal(ensureBoolean("true"), null);
      assert.equal(ensureBoolean(1), null);
      assert.equal(ensureBoolean(0), null);
      assert.equal(ensureBoolean(null), null);
      assert.equal(ensureBoolean(undefined), null);
      assert.equal(ensureBoolean({}), null);
    });
  });
});
