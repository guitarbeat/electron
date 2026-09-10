import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isUser,
  parseJsonContent,
  sanitizeInput,
  isValidUrl,
  normalizeMovieTitle,
  findMovieByNormalizedTitle,
  ensureFourDigitPin,
  ensureBoolean,
  KNOWN_USERS,
  USER_OPTIONS,
  MAX_MESSAGE_LENGTH,
  MAX_MOVIE_TITLE_LENGTH,
} from "./common.js";

describe("common utilities", () => {
  describe("constants", () => {
    it("exports expected constants", () => {
      assert.deepEqual(KNOWN_USERS, ["Aaron", "Electra"]);
      assert.deepEqual(USER_OPTIONS, ["Aaron", "Electra"]);
      assert.equal(MAX_MESSAGE_LENGTH, 500);
      assert.equal(MAX_MOVIE_TITLE_LENGTH, 200);
    });
  });

  describe("isUser", () => {
    it("returns true for valid known users", () => {
      assert.equal(isUser("Aaron"), true);
      assert.equal(isUser("Electra"), true);
    });

    it("returns false for invalid users or non-string inputs", () => {
      assert.equal(isUser("UnknownUser"), false);
      assert.equal(isUser("aaron"), false);
      assert.equal(isUser(123), false);
      assert.equal(isUser(null), false);
      assert.equal(isUser(undefined), false);
      assert.equal(isUser({}), false);
    });
  });

  describe("parseJsonContent", () => {
    it("parses valid JSON string", () => {
      const result = parseJsonContent('{"foo": "bar"}', "testContext");
      assert.deepEqual(result, { foo: "bar" });
    });

    it("throws wrapped error message when JSON parsing fails", () => {
      assert.throws(
        () => parseJsonContent("invalid json", "movieContext"),
        (err: unknown) => {
          assert(err instanceof Error);
          assert.match(err.message, /^Failed to parse JSON in movieContext: /);
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
      const input = "  \x00Hello\x07 \x1FWorld!\x7F  ";
      assert.equal(sanitizeInput(input), "Hello World!");
    });

    it("preserves valid printable characters and internal spaces", () => {
      assert.equal(sanitizeInput("  Inception (2010)  "), "Inception (2010)");
    });
  });

  describe("isValidUrl", () => {
    it("returns false for empty, null, or undefined strings", () => {
      assert.equal(isValidUrl(""), false);
      assert.equal(isValidUrl(null as unknown as string), false);
      assert.equal(isValidUrl(undefined as unknown as string), false);
    });

    it("returns true for valid http and https URLs", () => {
      assert.equal(isValidUrl("http://example.com"), true);
      assert.equal(isValidUrl("https://example.com/path?query=1#hash"), true);
    });

    it("returns false for non-http/https protocols", () => {
      assert.equal(isValidUrl("ftp://example.com"), false);
      assert.equal(isValidUrl("file:///path/to/file"), false);
      assert.equal(isValidUrl("javascript:alert(1)"), false);
      assert.equal(isValidUrl("data:text/plain;base64,SGVsbG8="), false);
    });

    it("returns false for malformed URLs", () => {
      assert.equal(isValidUrl("not-a-url"), false);
      assert.equal(isValidUrl("http://"), false);
      assert.equal(isValidUrl("://invalid"), false);
    });
  });

  describe("normalizeMovieTitle", () => {
    it("lowercases, trims, and collapses multiple spaces", () => {
      assert.equal(normalizeMovieTitle("  The   Dark   Knight  "), "the dark knight");
      assert.equal(normalizeMovieTitle("AVATAR"), "avatar");
    });
  });

  describe("findMovieByNormalizedTitle", () => {
    const movies = [
      { id: "1", title: "The Dark Knight" },
      { id: "2", title: "Inception" },
    ];

    it("finds movie ignoring case and extra whitespace", () => {
      const found = findMovieByNormalizedTitle(movies, "  the   dark  knight ");
      assert.deepEqual(found, movies[0]);
    });

    it("returns undefined if movie is not found", () => {
      const found = findMovieByNormalizedTitle(movies, "Interstellar");
      assert.equal(found, undefined);
    });
  });

  describe("ensureFourDigitPin", () => {
    it("returns 4-digit string if non-digit characters are stripped resulting in 4 digits", () => {
      assert.equal(ensureFourDigitPin("1234"), "1234");
      assert.equal(ensureFourDigitPin("1-2-3-4"), "1234");
      assert.equal(ensureFourDigitPin("a1b2c3d4"), "1234");
    });

    it("returns null if result is not exactly 4 digits", () => {
      assert.equal(ensureFourDigitPin("123"), null);
      assert.equal(ensureFourDigitPin("12345"), null);
      assert.equal(ensureFourDigitPin("abcd"), null);
      assert.equal(ensureFourDigitPin(""), null);
    });

    it("returns null for non-string inputs", () => {
      assert.equal(ensureFourDigitPin(1234), null);
      assert.equal(ensureFourDigitPin(null), null);
      assert.equal(ensureFourDigitPin(undefined), null);
      assert.equal(ensureFourDigitPin({}), null);
    });
  });

  describe("ensureBoolean", () => {
    it("returns boolean value when given a boolean", () => {
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
