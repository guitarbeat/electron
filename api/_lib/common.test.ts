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
    it("exports expected KNOWN_USERS", () => {
      assert.deepEqual(KNOWN_USERS, ["Aaron", "Electra"]);
    });

    it("exports USER_OPTIONS matching KNOWN_USERS", () => {
      assert.deepEqual(USER_OPTIONS, KNOWN_USERS);
    });

    it("exports numeric limit constants", () => {
      assert.equal(MAX_MESSAGE_LENGTH, 500);
      assert.equal(MAX_MOVIE_TITLE_LENGTH, 200);
    });
  });

  describe("isUser", () => {
    it("returns true for known users", () => {
      assert.equal(isUser("Aaron"), true);
      assert.equal(isUser("Electra"), true);
    });

    it("returns false for unknown user strings", () => {
      assert.equal(isUser("Unknown"), false);
      assert.equal(isUser("aaron"), false);
      assert.equal(isUser(""), false);
    });

    it("returns false for non-string values", () => {
      assert.equal(isUser(null), false);
      assert.equal(isUser(undefined), false);
      assert.equal(isUser(123), false);
      assert.equal(isUser({ name: "Aaron" }), false);
    });
  });

  describe("parseJsonContent", () => {
    it("parses valid JSON string", () => {
      const result = parseJsonContent('{"key":"value"}', "test context");
      assert.deepEqual(result, { key: "value" });
    });

    it("throws descriptive error when JSON parsing fails", () => {
      assert.throws(
        () => parseJsonContent("invalid json", "test context"),
        (err: Error) => {
          return err.message.includes("Failed to parse JSON in test context:");
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

    it("strips control characters and trims whitespace", () => {
      assert.equal(sanitizeInput("  hello\x00world\x07  "), "helloworld");
      assert.equal(sanitizeInput("\x08test\x1F"), "test");
    });

    it("preserves valid printable characters", () => {
      assert.equal(sanitizeInput("  Valid text 123!  "), "Valid text 123!");
    });
  });

  describe("isValidUrl", () => {
    it("returns true for valid http and https URLs", () => {
      assert.equal(isValidUrl("http://example.com"), true);
      assert.equal(isValidUrl("https://example.com/path?query=1"), true);
    });

    it("returns false for non-http/https protocols or invalid strings", () => {
      assert.equal(isValidUrl("ftp://example.com"), false);
      assert.equal(isValidUrl("javascript:alert(1)"), false);
      assert.equal(isValidUrl("not-a-url"), false);
      assert.equal(isValidUrl(""), false);
    });
  });

  describe("normalizeMovieTitle", () => {
    it("trims, lowercases, and normalizes whitespace", () => {
      assert.equal(normalizeMovieTitle("  The   Matrix  "), "the matrix");
      assert.equal(normalizeMovieTitle("INCEPTION"), "inception");
    });
  });

  describe("findMovieByNormalizedTitle", () => {
    const movies = [{ title: "The Matrix" }, { title: "Inception" }];

    it("finds movie ignoring case and extra whitespace", () => {
      assert.deepEqual(findMovieByNormalizedTitle(movies, "the  matrix"), {
        title: "The Matrix",
      });
      assert.deepEqual(findMovieByNormalizedTitle(movies, "INCEPTION"), {
        title: "Inception",
      });
    });

    it("returns undefined if movie is not found", () => {
      assert.equal(findMovieByNormalizedTitle(movies, "Avatar"), undefined);
    });
  });

  describe("ensureFourDigitPin", () => {
    it("returns 4-digit PIN string for valid inputs", () => {
      assert.equal(ensureFourDigitPin("1234"), "1234");
      assert.equal(ensureFourDigitPin("1a2b3c4"), "1234");
    });

    it("returns null for non-string inputs or inputs without 4 digits", () => {
      assert.equal(ensureFourDigitPin(1234), null);
      assert.equal(ensureFourDigitPin("123"), null);
      assert.equal(ensureFourDigitPin("12345"), null);
      assert.equal(ensureFourDigitPin(null), null);
    });
  });

  describe("ensureBoolean", () => {
    it("returns boolean for boolean inputs", () => {
      assert.equal(ensureBoolean(true), true);
      assert.equal(ensureBoolean(false), false);
    });

    it("returns null for non-boolean inputs", () => {
      assert.equal(ensureBoolean("true"), null);
      assert.equal(ensureBoolean(1), null);
      assert.equal(ensureBoolean(null), null);
      assert.equal(ensureBoolean(undefined), null);
    });
  });
});
