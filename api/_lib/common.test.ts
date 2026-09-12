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
    assert.strictEqual(USER_OPTIONS, KNOWN_USERS);
    assert.strictEqual(USER_OPTIONS.length, 2);
    assert.ok(Array.isArray(USER_OPTIONS));
    assert.ok(USER_OPTIONS.every((user) => isUser(user)));
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

  it("validates MAX_MESSAGE_LENGTH boundary constraints", () => {
    const validMessage = "a".repeat(MAX_MESSAGE_LENGTH);
    const invalidMessage = "a".repeat(MAX_MESSAGE_LENGTH + 1);

    assert.strictEqual(validMessage.length, 500);
    assert.strictEqual(validMessage.length <= MAX_MESSAGE_LENGTH, true);
    assert.strictEqual(invalidMessage.length, 501);
    assert.strictEqual(invalidMessage.length <= MAX_MESSAGE_LENGTH, false);
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
    assert.strictEqual(isUser(" Aaron "), false);
    assert.strictEqual(isUser("Aaron "), false);
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
  it("parses valid JSON content for various data types", () => {
    const objectData = { key: "value", count: 42, nested: { active: true } };
    assert.deepStrictEqual(parseJsonContent(JSON.stringify(objectData), "testContext"), objectData);

    const arrayData = [1, "two", true, null, { id: 3 }];
    assert.deepStrictEqual(parseJsonContent(JSON.stringify(arrayData), "testContext"), arrayData);

    assert.strictEqual(parseJsonContent("123.45", "testContext"), 123.45);
    assert.strictEqual(parseJsonContent("true", "testContext"), true);
    assert.strictEqual(parseJsonContent("false", "testContext"), false);
    assert.strictEqual(parseJsonContent('"hello world"', "testContext"), "hello world");
    assert.strictEqual(parseJsonContent("null", "testContext"), null);
  });

  it("throws formatted error containing context when JSON syntax is invalid", () => {
    assert.throws(
      () => parseJsonContent("{ invalid json }", "movieData"),
      (err: Error) => {
        assert.strictEqual(err instanceof Error, true);
        assert.ok(
          err.message.startsWith("Failed to parse JSON in movieData:"),
          `Expected message to start with context error, got: ${err.message}`
        );
        return true;
      },
    );

    assert.throws(
      () => parseJsonContent("[1, 2,", "userConfig"),
      (err: Error) => {
        assert.ok(err.message.includes("Failed to parse JSON in userConfig:"));
        return true;
      },
    );
  });

  it("handles non-Error thrown exceptions during JSON parsing", (t) => {
    t.mock.method(JSON, "parse", () => {
      throw "Primitive string error";
    });

    assert.throws(
      () => parseJsonContent('{"test": true}', "customScope"),
      (err: Error) => {
        assert.strictEqual(
          err.message,
          "Failed to parse JSON in customScope: Primitive string error"
        );
        return true;
      }
    );
  });

  it("handles non-Error thrown values when parsing JSON fails", (t) => {
    t.mock.method(JSON, "parse", () => {
      throw "Raw string error";
    });

    assert.throws(
      () => parseJsonContent("{}", "customContext"),
      (err: Error) => {
        assert.ok(
          err.message.includes(
            "Failed to parse JSON in customContext: Raw string error",
          ),
        );
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
    assert.strictEqual(sanitizeInput("   "), "");
  });

  it("removes all control characters in range \\x00-\\x08", () => {
    const controlChars = String.fromCharCode(0, 1, 2, 3, 4, 5, 6, 7, 8);
    const input = `A${controlChars}B`;
    assert.strictEqual(sanitizeInput(input), "AB");
  });

  it("removes all control characters in range \\x0B-\\x0C", () => {
    const controlChars = String.fromCharCode(11, 12);
    const input = `A${controlChars}B`;
    assert.strictEqual(sanitizeInput(input), "AB");
  });

  it("removes all control characters in range \\x0E-\\x1F and \\x7F", () => {
    const range1 = Array.from({ length: 0x1f - 0x0e + 1 }, (_, i) =>
      String.fromCharCode(0x0e + i),
    ).join("");
    const del = String.fromCharCode(0x7f);
    const input = `A${range1}${del}B`;
    assert.strictEqual(sanitizeInput(input), "AB");
  });

  it("preserves tab (\\x09), newline (\\x0A), and carriage return (\\x0D) inside text", () => {
    const input = "Line 1\nLine 2\r\nLine 3\tTabbed";
    assert.strictEqual(sanitizeInput(input), "Line 1\nLine 2\r\nLine 3\tTabbed");
  });

  it("preserves unicode characters, emojis, and accented letters", () => {
    const input = "  \u0000Café 🎬 🚀  ";
    assert.strictEqual(sanitizeInput(input), "Café 🎬 🚀");
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

  it("handles empty string and whitespace-only string", () => {
    assert.strictEqual(normalizeMovieTitle(""), "");
    assert.strictEqual(normalizeMovieTitle("   "), "");
    assert.strictEqual(normalizeMovieTitle("\t\n\r"), "");
  });

  it("collapses tabs, newlines, and mixed whitespace into single spaces", () => {
    assert.strictEqual(
      normalizeMovieTitle("Blade\nRunner\t2049\r\n  Director\x27s   Cut"),
      "blade runner 2049 director's cut",
    );
  });

  it("preserves punctuation, numbers, and special characters while lowercasing", () => {
    assert.strictEqual(
      normalizeMovieTitle("  WALL-E  (2008) !  "),
      "wall-e (2008) !",
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
