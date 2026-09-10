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

describe("common constants", () => {
  it("defines KNOWN_USERS and USER_OPTIONS", () => {
    assert.deepEqual(KNOWN_USERS, ["Aaron", "Electra"]);
    assert.equal(USER_OPTIONS, KNOWN_USERS);
  });

  it("defines MAX_MESSAGE_LENGTH and MAX_MOVIE_TITLE_LENGTH constants", () => {
    assert.equal(MAX_MESSAGE_LENGTH, 500);
    assert.equal(MAX_MOVIE_TITLE_LENGTH, 200);
  });
});

describe("isUser", () => {
  it("returns true for known users", () => {
    assert.equal(isUser("Aaron"), true);
    assert.equal(isUser("Electra"), true);
  });

  it("returns false for unknown strings or wrong case", () => {
    assert.equal(isUser("aaron"), false);
    assert.equal(isUser("John"), false);
    assert.equal(isUser(""), false);
  });

  it("returns false for non-string values", () => {
    assert.equal(isUser(123), false);
    assert.equal(isUser(null), false);
    assert.equal(isUser(undefined), false);
    assert.equal(isUser({}), false);
    assert.equal(isUser(["Aaron"]), false);
  });
});

describe("parseJsonContent", () => {
  it("parses valid JSON content", () => {
    assert.deepEqual(parseJsonContent('{"foo": "bar"}', "test context"), {
      foo: "bar",
    });
    assert.equal(parseJsonContent("123", "test context"), 123);
  });

  it("throws formatted error for invalid JSON", () => {
    assert.throws(
      () => parseJsonContent("invalid json", "movie data"),
      (err: unknown) => {
        assert(err instanceof Error);
        assert.match(
          err.message,
          /^Failed to parse JSON in movie data: Unexpected token/,
        );
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

  it("removes control characters and trims whitespace", () => {
    assert.equal(sanitizeInput("  hello\x00world\x1F  "), "helloworld");
    assert.equal(sanitizeInput("\x07  clean text  \x7F"), "clean text");
  });
});

describe("isValidUrl", () => {
  it("returns true for valid http and https URLs", () => {
    assert.equal(isValidUrl("http://example.com"), true);
    assert.equal(isValidUrl("https://example.com/path?arg=1"), true);
  });

  it("returns false for invalid URLs or unsupported protocols", () => {
    assert.equal(isValidUrl("ftp://example.com"), false);
    assert.equal(isValidUrl("javascript:alert(1)"), false);
    assert.equal(isValidUrl("not a url"), false);
    assert.equal(isValidUrl(""), false);
  });
});

describe("normalizeMovieTitle", () => {
  it("trims, lowercases, and normalizes spacing", () => {
    assert.equal(
      normalizeMovieTitle("  The   Matrix  Reloaded "),
      "the matrix reloaded",
    );
  });
});

describe("findMovieByNormalizedTitle", () => {
  const movies = [
    { title: "Inception", id: 1 },
    { title: "The Dark Knight", id: 2 },
  ];

  it("finds a movie with matching title case-insensitively and with extra whitespace", () => {
    const found = findMovieByNormalizedTitle(movies, "  the   dark KNIGHT ");
    assert.deepEqual(found, { title: "The Dark Knight", id: 2 });
  });

  it("returns undefined if no movie matches", () => {
    assert.equal(findMovieByNormalizedTitle(movies, "Interstellar"), undefined);
  });
});

describe("ensureFourDigitPin", () => {
  it("extracts valid 4-digit PINs", () => {
    assert.equal(ensureFourDigitPin("1234"), "1234");
    assert.equal(ensureFourDigitPin("1-2-3-4"), "1234");
  });

  it("returns null for non-4-digit or non-string values", () => {
    assert.equal(ensureFourDigitPin("123"), null);
    assert.equal(ensureFourDigitPin("12345"), null);
    assert.equal(ensureFourDigitPin("abcd"), null);
    assert.equal(ensureFourDigitPin(1234), null);
    assert.equal(ensureFourDigitPin(null), null);
  });
});

describe("ensureBoolean", () => {
  it("returns boolean value for booleans", () => {
    assert.equal(ensureBoolean(true), true);
    assert.equal(ensureBoolean(false), false);
  });

  it("returns null for non-boolean values", () => {
    assert.equal(ensureBoolean("true"), null);
    assert.equal(ensureBoolean(1), null);
    assert.equal(ensureBoolean(0), null);
    assert.equal(ensureBoolean(null), null);
    assert.equal(ensureBoolean(undefined), null);
  });
});
