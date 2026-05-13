import { test, describe } from "node:test";
import assert from "node:assert";

import { isStateScope, STATE_SCOPES, StateClientError } from "./stateTypes.ts";

describe("stateTypes", () => {
  describe("isStateScope", () => {
    test("returns true for all valid STATE_SCOPES", () => {
      for (const scope of STATE_SCOPES) {
        assert.strictEqual(
          isStateScope(scope),
          true,
          `Expected scope "${scope}" to be valid`,
        );
      }
    });

    test("returns false for invalid scopes", () => {
      const invalidScopes = [
        "",
        "foo",
        "movies_invalid",
        null,
        undefined,
        123,
        {},
      ];
      for (const invalid of invalidScopes) {
        assert.strictEqual(
          isStateScope(invalid as string),
          false,
          `Expected scope "${invalid}" to be invalid`,
        );
      }
    });
  });

  describe("StateClientError", () => {
    test("constructs an error with message, status, code, and default properties", () => {
      const error = new StateClientError("Test error message", 404, "invalid");

      assert.strictEqual(error instanceof Error, true);
      assert.strictEqual(error.name, "StateClientError");
      assert.strictEqual(error.message, "Test error message");
      assert.strictEqual(error.status, 404);
      assert.strictEqual(error.code, "invalid");
      assert.strictEqual(error.conflict, undefined);
    });

    test("constructs an error with a conflict payload", () => {
      const conflictPayload = {
        currentData: { foo: "bar" },
        currentVersion: "v2",
        conflict: "Version mismatch",
      };
      const error = new StateClientError(
        "Conflict detected",
        409,
        "conflict",
        conflictPayload,
      );

      assert.strictEqual(error instanceof Error, true);
      assert.strictEqual(error.name, "StateClientError");
      assert.strictEqual(error.message, "Conflict detected");
      assert.strictEqual(error.status, 409);
      assert.strictEqual(error.code, "conflict");
      assert.deepStrictEqual(error.conflict, conflictPayload);
    });
  });
});
