import { describe, it } from "node:test";
import assert from "node:assert";
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
  MAX_MESSAGE_LENGTH,
  MAX_MOVIE_TITLE_LENGTH,
  USER_OPTIONS,
} from "./common.js";

describe("api/_lib/common", () => {
  describe("constants and types", () => {
    it("should export KNOWN_USERS and USER_OPTIONS", () => {
      assert.deepStrictEqual(KNOWN_USERS, ["Aaron", "Electra"]);
      assert.deepStrictEqual(USER_OPTIONS, ["Aaron", "Electra"]);
      assert.strictEqual(MAX_MESSAGE_LENGTH, 500);
      assert.strictEqual(MAX_MOVIE_TITLE_LENGTH, 200);
    });
  });

  describe("isUser", () => {
    it("should return true for known users", () => {
      assert.strictEqual(isUser("Aaron"), true);
      assert.strictEqual(isUser("Electra"), true);
    });

    it("should return false for unknown strings or non-string values", () => {
      assert.strictEqual(isUser("Unknown"), false);
      assert.strictEqual(isUser("aaron"), false);
      assert.strictEqual(isUser(""), false);
      assert.strictEqual(isUser(null), false);
      assert.strictEqual(isUser(undefined), false);
      assert.strictEqual(isUser(123), false);
      assert.strictEqual(isUser({}), false);
    });
  });

  describe("parseJsonContent", () => {
    it("should parse valid JSON content", () => {
      const result = parseJsonContent('{"key": "value", "num": 42}', "testContext");
      assert.deepStrictEqual(result, { key: "value", num: 42 });
    });

    it("should throw descriptive error when JSON parsing fails", () => {
      assert.throws(
        () => parseJsonContent("invalid json", "myContext"),
        (err: Error) => {
          assert.strictEqual(err instanceof Error, true);
          assert.match(err.message, /^Failed to parse JSON in myContext: /);
          return true;
        },
      );
    });
  });

  describe("sanitizeInput", () => {
    it("should return empty string for null, undefined, or empty string", () => {
      assert.strictEqual(sanitizeInput(null), "");
      assert.strictEqual(sanitizeInput(undefined), "");
      assert.strictEqual(sanitizeInput(""), "");
    });

    it("should strip ASCII control characters (\x00-\x08, \x0B-\x0C, \x0E-\x1F, \x7F)", () => {
      const input = "Hello\x00\x01\x08 World\x0B\x0C!\x0E\x1F\x7F";
      assert.strictEqual(sanitizeInput(input), "Hello World!");
    });

    it("should trim surrounding whitespace", () => {
      assert.strictEqual(sanitizeInput("   sample text   "), "sample text");
    });

    it("should keep normal printable characters and allowed whitespace intact", () => {
      const normal = "Valid Title 123! @#$%^&*()";
      assert.strictEqual(sanitizeInput(normal), normal);
    });
  });

  describe("isValidUrl", () => {
    it("should return true for valid HTTP and HTTPS URLs", () => {
      assert.strictEqual(isValidUrl("http://example.com"), true);
      assert.strictEqual(isValidUrl("https://example.com/path?query=1#hash"), true);
    });

    it("should return false for non-http/https protocols or malformed URLs", () => {
      assert.strictEqual(isValidUrl("ftp://example.com"), false);
      assert.strictEqual(isValidUrl("javascript:alert(1)"), false);
      assert.strictEqual(isValidUrl("not a url"), false);
      assert.strictEqual(isValidUrl(""), false);
    });
  });

  describe("normalizeMovieTitle", () => {
    it("should trim, lowercase, and collapse multiple whitespace characters", () => {
      assert.strictEqual(normalizeMovieTitle("  The   Dark   Knight  "), "the dark knight");
      assert.strictEqual(normalizeMovieTitle("INCEPTION"), "inception");
    });
  });

  describe("findMovieByNormalizedTitle", () => {
    const movies = [
      { id: 1, title: "The Dark Knight" },
      { id: 2, title: " Inception " },
    ];

    it("should find movie by title ignoring case and extra whitespace", () => {
      const found = findMovieByNormalizedTitle(movies, "  the dark   knight ");
      assert.deepStrictEqual(found, movies[0]);

      const found2 = findMovieByNormalizedTitle(movies, "INCEPTION");
      assert.deepStrictEqual(found2, movies[1]);
    });

    it("should return undefined if movie is not found", () => {
      assert.strictEqual(findMovieByNormalizedTitle(movies, "Interstellar"), undefined);
    });
  });

  describe("ensureFourDigitPin", () => {
    it("should return 4-digit PIN string when input contains 4 digits", () => {
      assert.strictEqual(ensureFourDigitPin("1234"), "1234");
      assert.strictEqual(ensureFourDigitPin("1-2-3-4"), "1234");
      assert.strictEqual(ensureFourDigitPin(" 5 6 7 8 "), "5678");
    });

    it("should return null if non-string or digit count is not 4", () => {
      assert.strictEqual(ensureFourDigitPin("123"), null);
      assert.strictEqual(ensureFourDigitPin("12345"), null);
      assert.strictEqual(ensureFourDigitPin("abcd"), null);
      assert.strictEqual(ensureFourDigitPin(1234), null);
      assert.strictEqual(ensureFourDigitPin(null), null);
      assert.strictEqual(ensureFourDigitPin(undefined), null);
    });
  });

  describe("ensureBoolean", () => {
    it("should return boolean value when input is boolean", () => {
      assert.strictEqual(ensureBoolean(true), true);
      assert.strictEqual(ensureBoolean(false), false);
    });

    it("should return null for non-boolean values", () => {
      assert.strictEqual(ensureBoolean("true"), null);
      assert.strictEqual(ensureBoolean(1), null);
      assert.strictEqual(ensureBoolean(0), null);
      assert.strictEqual(ensureBoolean(null), null);
      assert.strictEqual(ensureBoolean(undefined), null);
    });
  });
});
