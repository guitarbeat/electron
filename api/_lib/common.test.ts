import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ensureBoolean,
  ensureFourDigitPin,
  findMovieByNormalizedTitle,
  isUser,
  isValidUrl,
  normalizeMovieTitle,
  parseJsonContent,
  sanitizeInput,
} from "./common.js";

describe("common utilities", () => {
  describe("isUser", () => {
    it("returns true for known users", () => {
      assert.equal(isUser("Aaron"), true);
      assert.equal(isUser("Electra"), true);
    });

    it("returns false for unknown users or invalid input types", () => {
      assert.equal(isUser("Unknown"), false);
      assert.equal(isUser("aaron"), false);
      assert.equal(isUser(""), false);
      assert.equal(isUser(123), false);
      assert.equal(isUser(null), false);
      assert.equal(isUser(undefined), false);
      assert.equal(isUser({}), false);
    });
  });

  describe("parseJsonContent", () => {
    it("parses valid JSON content correctly", () => {
      const result = parseJsonContent('{"key": "value"}', "testContext");
      assert.deepEqual(result, { key: "value" });
    });

    it("throws a descriptive error when parsing invalid JSON", () => {
      assert.throws(
        () => parseJsonContent("invalid json", "movie list"),
        (err: Error) => {
          assert.match(err.message, /^Failed to parse JSON in movie list:/);
          return true;
        },
      );
    });
  });

  describe("sanitizeInput", () => {
    it("returns empty string for null, undefined, or empty string", () => {
      assert.equal(sanitizeInput(null), "");
      assert.equal(sanitizeInput(undefined), "");
      assert.equal(sanitizeInput(""), "");
    });

    it("trims surrounding whitespace and removes control characters", () => {
      assert.equal(sanitizeInput("  hello \x00world\x07!  "), "hello world!");
      assert.equal(sanitizeInput("\x1Ftest\x7F"), "test");
    });
  });

  describe("isValidUrl", () => {
    it("returns true for valid http and https URLs", () => {
      assert.equal(isValidUrl("http://example.com"), true);
      assert.equal(isValidUrl("https://example.com/path?query=1"), true);
    });

    it("returns false for non-http/https protocols", () => {
      assert.equal(isValidUrl("ftp://example.com"), false);
      assert.equal(isValidUrl("mailto:user@example.com"), false);
      assert.equal(isValidUrl("javascript:alert(1)"), false);
    });

    it("returns false for invalid URLs or empty strings", () => {
      assert.equal(isValidUrl("not a url"), false);
      assert.equal(isValidUrl(""), false);
    });
  });

  describe("normalizeMovieTitle", () => {
    it("trims whitespace and converts to lowercase", () => {
      assert.equal(normalizeMovieTitle("  Inception  "), "inception");
    });

    it("collapses multiple consecutive whitespace characters into a single space", () => {
      assert.equal(
        normalizeMovieTitle(" The   Lord \t of  \n the Rings "),
        "the lord of the rings",
      );
    });
  });

  describe("findMovieByNormalizedTitle", () => {
    const movies = [
      { id: 1, title: "The Matrix" },
      { id: 2, title: "Inception" },
      { id: 3, title: "Interstellar" },
    ];

    it("finds a movie matching exact or normalized title", () => {
      assert.deepEqual(findMovieByNormalizedTitle(movies, "The Matrix"), movies[0]);
      assert.deepEqual(findMovieByNormalizedTitle(movies, "  the   matrix "), movies[0]);
      assert.deepEqual(findMovieByNormalizedTitle(movies, "INCEPTION"), movies[1]);
    });

    it("returns undefined if no movie matches", () => {
      assert.equal(findMovieByNormalizedTitle(movies, "Avatar"), undefined);
    });
  });

  describe("ensureFourDigitPin", () => {
    it("returns 4-digit pin when valid string of 4 digits or non-digits stripped to 4 digits is provided", () => {
      assert.equal(ensureFourDigitPin("1234"), "1234");
      assert.equal(ensureFourDigitPin("1a2b3c4d"), "1234");
    });

    it("returns null for non-string values or strings that do not contain exactly 4 digits after stripping non-digits", () => {
      assert.equal(ensureFourDigitPin(1234), null);
      assert.equal(ensureFourDigitPin(null), null);
      assert.equal(ensureFourDigitPin(undefined), null);
      assert.equal(ensureFourDigitPin("123"), null);
      assert.equal(ensureFourDigitPin("12345"), null);
      assert.equal(ensureFourDigitPin("abcd"), null);
    });
  });

  describe("ensureBoolean", () => {
    it("returns boolean value when input is a boolean", () => {
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
