import { describe, it } from "node:test";
import assert from "node:assert";
import {
  isUser,
  parseJsonContent,
  sanitizeInput,
  KNOWN_USERS,
} from "./common.js";

describe("common utility functions", () => {
  describe("isUser", () => {
    it("should return true for valid known users", () => {
      for (const user of KNOWN_USERS) {
        assert.strictEqual(isUser(user), true);
      }
    });

    it("should return false for invalid strings or non-string values", () => {
      assert.strictEqual(isUser("UnknownUser"), false);
      assert.strictEqual(isUser(null), false);
      assert.strictEqual(isUser(undefined), false);
      assert.strictEqual(isUser(123), false);
      assert.strictEqual(isUser({}), false);
    });
  });

  describe("parseJsonContent", () => {
    it("should successfully parse valid JSON string", () => {
      const json = JSON.stringify({ key: "value", count: 42 });
      const result = parseJsonContent(json, "test context");
      assert.deepStrictEqual(result, { key: "value", count: 42 });
    });

    it("should handle Error instances in JSON.parse catch block", () => {
      const invalidJson = "{ invalid json }";
      assert.throws(
        () => parseJsonContent(invalidJson, "user request"),
        (err: unknown) => {
          assert(err instanceof Error);
          assert.match(
            err.message,
            /^Failed to parse JSON in user request: /
          );
          return true;
        }
      );
    });

    it("should handle non-Error thrown values in JSON.parse catch block", () => {
      const originalParse = JSON.parse;
      try {
        JSON.parse = () => {
          throw "string error exception";
        };

        assert.throws(
          () => parseJsonContent("{}", "custom context"),
          (err: unknown) => {
            assert(err instanceof Error);
            assert.strictEqual(
              err.message,
              "Failed to parse JSON in custom context: string error exception"
            );
            return true;
          }
        );
      } finally {
        JSON.parse = originalParse;
      }
    });
  });

  describe("sanitizeInput", () => {
    it("should return empty string for null or undefined or empty inputs", () => {
      assert.strictEqual(sanitizeInput(null), "");
      assert.strictEqual(sanitizeInput(undefined), "");
      assert.strictEqual(sanitizeInput(""), "");
    });

    it("should strip control characters and trim whitespace", () => {
      const inputWithControlChars = "  hello\x00world\x07\x1F  ";
      assert.strictEqual(sanitizeInput(inputWithControlChars), "helloworld");
    });
  });
});
