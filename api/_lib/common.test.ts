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
  MAX_MOVIE_TITLE_LENGTH
} from "./common.js";


describe("constants", () => {
  it("defines KNOWN_USERS and USER_OPTIONS", () => {
    assert.deepEqual(KNOWN_USERS, ["Aaron", "Electra"]);
    assert.deepEqual(USER_OPTIONS, ["Aaron", "Electra"]);
  });

  it("defines MAX_MESSAGE_LENGTH and MAX_MOVIE_TITLE_LENGTH", () => {
    assert.equal(MAX_MESSAGE_LENGTH, 500);
    assert.equal(MAX_MOVIE_TITLE_LENGTH, 200);
  });

  it("validates title string length boundaries against MAX_MOVIE_TITLE_LENGTH", () => {
    const validTitle = "A".repeat(MAX_MOVIE_TITLE_LENGTH);
    const invalidTitle = "A".repeat(MAX_MOVIE_TITLE_LENGTH + 1);

    assert.equal(validTitle.length, 200);
    assert.equal(invalidTitle.length, 201);
    assert.equal(validTitle.length <= MAX_MOVIE_TITLE_LENGTH, true);
    assert.equal(invalidTitle.length <= MAX_MOVIE_TITLE_LENGTH, false);
  });
});

describe("isUser", () => {
  it("returns true for known users", () => {
    for (const user of KNOWN_USERS) {
      assert.strictEqual(isUser(user), true);
    }
  });

  it("returns false for unknown user strings", () => {
    assert.strictEqual(isUser("UnknownUser"), false);
    assert.strictEqual(isUser("aaron"), false);
    assert.strictEqual(isUser("ELECTRA"), false);
    assert.strictEqual(isUser(""), false);
  });

  it("returns false for non-string values", () => {
    assert.strictEqual(isUser(null), false);
    assert.strictEqual(isUser(undefined), false);
    assert.strictEqual(isUser(123), false);
    assert.strictEqual(isUser(true), false);
    assert.strictEqual(isUser({ name: "Aaron" }), false);
    assert.strictEqual(isUser(["Aaron"]), false);
  });
});

describe("parseJsonContent", () => {
  it("parses valid JSON content", () => {
    const data = { key: "value", count: 42 };
    const jsonString = JSON.stringify(data);
    assert.deepStrictEqual(parseJsonContent(jsonString, "testContext"), data);
  });

  it("throws formatted error for invalid JSON content", () => {
    assert.throws(
      () => parseJsonContent("{ invalid json }", "movieData"),
      (err: Error) => {
        assert.ok(err.message.includes("Failed to parse JSON in movieData:"));
        return true;
      },
    );
  });
});

describe("sanitizeInput", () => {
  it("trims whitespace and removes ASCII control characters", () => {
    const input = " \u0000Hello \u0007World\u007F ";
    assert.strictEqual(sanitizeInput(input), "Hello World");
  });

  it("returns empty string for null, undefined, or empty string", () => {
    assert.strictEqual(sanitizeInput(null), "");
    assert.strictEqual(sanitizeInput(undefined), "");
    assert.strictEqual(sanitizeInput(""), "");
  });
});

describe("isValidUrl", () => {
  it("returns true for valid http and https URLs", () => {
    assert.strictEqual(isValidUrl("https://example.com"), true);
    assert.strictEqual(isValidUrl("http://example.com/path?query=1"), true);
  });

  it("returns false for non-http/https protocols or invalid URLs", () => {
    assert.strictEqual(isValidUrl("ftp://example.com"), false);
    assert.strictEqual(isValidUrl("javascript:alert(1)"), false);
    assert.strictEqual(isValidUrl("not-a-url"), false);
    assert.strictEqual(isValidUrl(""), false);
  });
});

describe("normalizeMovieTitle", () => {
  it("trims, lowercases, and collapses internal whitespace", () => {
    assert.strictEqual(
      normalizeMovieTitle("  The   Dark   Knight  "),
      "the dark knight",
    );
  });
});

describe("findMovieByNormalizedTitle", () => {
  const movies = [
    { title: "Inception", id: "1" },
    { title: "The Dark Knight", id: "2" },
  ];

  it("finds a movie with case and whitespace variations", () => {
    const found = findMovieByNormalizedTitle(movies, "  the   dark  knight ");
    assert.deepStrictEqual(found, movies[1]);
  });

  it("returns undefined when no match is found", () => {
    const found = findMovieByNormalizedTitle(movies, "Interstellar");
    assert.strictEqual(found, undefined);
  });
});

describe("ensureFourDigitPin", () => {
  it("extracts and validates 4-digit PINs", () => {
    assert.strictEqual(ensureFourDigitPin("1234"), "1234");
    assert.strictEqual(ensureFourDigitPin(" 1-2 3 4 "), "1234");
  });

  it("returns null for non-4-digit or non-string inputs", () => {
    assert.strictEqual(ensureFourDigitPin("123"), null);
    assert.strictEqual(ensureFourDigitPin("12345"), null);
    assert.strictEqual(ensureFourDigitPin(1234), null);
    assert.strictEqual(ensureFourDigitPin(null), null);
  });
});

describe("ensureBoolean", () => {
  it("returns boolean values when passed a boolean", () => {
    assert.strictEqual(ensureBoolean(true), true);
    assert.strictEqual(ensureBoolean(false), false);
  });

  it("returns null for non-boolean inputs", () => {
    assert.strictEqual(ensureBoolean("true"), null);
    assert.strictEqual(ensureBoolean(1), null);
    assert.strictEqual(ensureBoolean(null), null);
    assert.strictEqual(ensureBoolean(undefined), null);
  });
});
