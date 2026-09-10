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

    it("returns false for unknown users and non-string inputs", () => {
      assert.equal(isUser("Unknown"), false);
      assert.equal(isUser("aaron"), false);
      assert.equal(isUser(123), false);
      assert.equal(isUser(null), false);
      assert.equal(isUser(undefined), false);
      assert.equal(isUser({}), false);
    });
  });

  describe("parseJsonContent", () => {
    it("parses valid JSON strings correctly", () => {
      assert.deepEqual(parseJsonContent('{"key": "value"}', "testContext"), {
        key: "value",
      });
      assert.deepEqual(parseJsonContent("[1, 2, 3]", "testContext"), [1, 2, 3]);
      assert.equal(parseJsonContent('"hello"', "testContext"), "hello");
      assert.equal(parseJsonContent("123", "testContext"), 123);
      assert.equal(parseJsonContent("true", "testContext"), true);
      assert.equal(parseJsonContent("null", "testContext"), null);
    });

    it("throws descriptive error with context on invalid JSON", () => {
      assert.throws(
        () => parseJsonContent("invalid json", "movies"),
        (err: unknown) => {
          assert(err instanceof Error);
          assert(err.message.startsWith("Failed to parse JSON in movies:"));
          return true;
        },
      );
    });
  });

  describe("sanitizeInput", () => {
    it("returns empty string for null, undefined, or empty input", () => {
      assert.equal(sanitizeInput(null), "");
      assert.equal(sanitizeInput(undefined), "");
      assert.equal(sanitizeInput(""), "");
    });

    it("strips ASCII control characters and trims whitespace", () => {
      assert.equal(sanitizeInput("  hello \x00\x07world  "), "hello world");
      assert.equal(sanitizeInput("\x1Ftest\x7F"), "test");
    });
  });

  describe("isValidUrl", () => {
    it("returns true for valid http and https URLs", () => {
      assert.equal(isValidUrl("http://example.com"), true);
      assert.equal(isValidUrl("https://example.com/path?query=1"), true);
    });

    it("returns false for non-http/https protocols, invalid URLs, or empty input", () => {
      assert.equal(isValidUrl("ftp://example.com"), false);
      assert.equal(isValidUrl("javascript:alert(1)"), false);
      assert.equal(isValidUrl("not a url"), false);
      assert.equal(isValidUrl(""), false);
    });
  });

  describe("normalizeMovieTitle", () => {
    it("lowercases, trims, and collapses multiple spaces", () => {
      assert.equal(
        normalizeMovieTitle("  The   Matrix  "),
        "the matrix",
      );
      assert.equal(
        normalizeMovieTitle("INCEPTION\n\t"),
        "inception",
      );
    });
  });

  describe("findMovieByNormalizedTitle", () => {
    const movies = [
      { id: "1", title: "The Matrix" },
      { id: "2", title: "Inception" },
    ];

    it("finds a movie with matching title regardless of casing/spacing", () => {
      const match = findMovieByNormalizedTitle(movies, "  the   matrix ");
      assert.deepEqual(match, { id: "1", title: "The Matrix" });
    });

    it("returns undefined if no movie matches or array is empty", () => {
      assert.equal(findMovieByNormalizedTitle(movies, "Avatar"), undefined);
      assert.equal(findMovieByNormalizedTitle([], "The Matrix"), undefined);
    });
  });

  describe("ensureFourDigitPin", () => {
    it("returns 4-digit PIN string for valid inputs", () => {
      assert.equal(ensureFourDigitPin("1234"), "1234");
      assert.equal(ensureFourDigitPin("1a2b3c4"), "1234");
    });

    it("returns null for non-string or invalid length digit strings", () => {
      assert.equal(ensureFourDigitPin("123"), null);
      assert.equal(ensureFourDigitPin("12345"), null);
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
