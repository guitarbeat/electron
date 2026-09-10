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
  describe("constants", () => {
    it("defines KNOWN_USERS and USER_OPTIONS", () => {
      assert.deepEqual(KNOWN_USERS, ["Aaron", "Electra"]);
      assert.deepEqual(USER_OPTIONS, ["Aaron", "Electra"]);
    });

    it("defines MAX_MESSAGE_LENGTH and MAX_MOVIE_TITLE_LENGTH", () => {
      assert.equal(MAX_MESSAGE_LENGTH, 500);
      assert.equal(MAX_MOVIE_TITLE_LENGTH, 200);
    });
  });

  describe("isUser", () => {
    it("returns true for known users", () => {
      assert.equal(isUser("Aaron"), true);
      assert.equal(isUser("Electra"), true);
    });

    it("returns false for unknown users or invalid types", () => {
      assert.equal(isUser("Unknown"), false);
      assert.equal(isUser("aaron"), false);
      assert.equal(isUser(123), false);
      assert.equal(isUser(null), false);
      assert.equal(isUser(undefined), false);
      assert.equal(isUser({}), false);
    });
  });

  describe("parseJsonContent", () => {
    it("parses valid JSON string", () => {
      const data = { key: "value", num: 42 };
      assert.deepEqual(parseJsonContent(JSON.stringify(data), "testContext"), data);
    });

    it("throws error with context description on invalid JSON", () => {
      assert.throws(
        () => parseJsonContent("{ invalid json }", "movieData"),
        (err: unknown) => {
          assert(err instanceof Error);
          assert(err.message.includes("Failed to parse JSON in movieData:"));
          return true;
        },
      );
    });
  });

  describe("sanitizeInput", () => {
    it("returns empty string for empty, null, or undefined input", () => {
      assert.equal(sanitizeInput(""), "");
      assert.equal(sanitizeInput(null), "");
      assert.equal(sanitizeInput(undefined), "");
    });

    it("strips control characters and trims whitespace", () => {
      const inputWithControlChars = " \x00Hello\x07 \x1FWorld\x7F ";
      assert.equal(sanitizeInput(inputWithControlChars), "Hello World");
    });
  });

  describe("isValidUrl", () => {
    it("returns true for valid http and https URLs", () => {
      assert.equal(isValidUrl("http://example.com"), true);
      assert.equal(isValidUrl("https://example.com/path?query=1"), true);
    });

    it("returns false for non-http protocols or invalid URLs", () => {
      assert.equal(isValidUrl("ftp://example.com"), false);
      assert.equal(isValidUrl("javascript:alert(1)"), false);
      assert.equal(isValidUrl("not-a-url"), false);
      assert.equal(isValidUrl(""), false);
    });
  });

  describe("normalizeMovieTitle", () => {
    it("lowercases, trims, and normalizes spaces in titles", () => {
      assert.equal(normalizeMovieTitle("  The   Matrix  "), "the matrix");
      assert.equal(normalizeMovieTitle("INCEPTION\t"), "inception");
    });
  });

  describe("findMovieByNormalizedTitle", () => {
    const movies = [
      { title: "Inception", year: 2010 },
      { title: "The Dark Knight", year: 2008 },
    ];

    it("finds movie matching title regardless of case or spacing", () => {
      assert.deepEqual(
        findMovieByNormalizedTitle(movies, "  the   dark  knight "),
        movies[1],
      );
    });

    it("returns undefined when movie is not found", () => {
      assert.equal(findMovieByNormalizedTitle(movies, "Interstellar"), undefined);
    });
  });

  describe("ensureFourDigitPin", () => {
    it("returns 4-digit PIN string when valid digits provided", () => {
      assert.equal(ensureFourDigitPin("1234"), "1234");
      assert.equal(ensureFourDigitPin("1-2-3-4"), "1234");
    });

    it("returns null when digits count is not 4 or non-string input", () => {
      assert.equal(ensureFourDigitPin("123"), null);
      assert.equal(ensureFourDigitPin("12345"), null);
      assert.equal(ensureFourDigitPin(1234), null);
      assert.equal(ensureFourDigitPin(null), null);
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
    });
  });
});
