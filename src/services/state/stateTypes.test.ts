import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isStateScope, StateClientError } from "./stateTypes.ts";

describe("stateTypes", () => {
  describe("isStateScope", () => {
    it("should return true for valid state scopes", () => {
      assert.equal(isStateScope("movies"), true);
      assert.equal(isStateScope("messages"), true);
      assert.equal(isStateScope("memories"), true);
      assert.equal(isStateScope("dailySpin"), true);
    });

    it("should return false for invalid state scopes", () => {
      assert.equal(isStateScope("invalid"), false);
      assert.equal(isStateScope(""), false);
      assert.equal(isStateScope("movies_"), false);
    });
  });

  describe("StateClientError", () => {
    it("should correctly instantiate with required parameters", () => {
      const error = new StateClientError(
        "Unauthorized access",
        401,
        "unauthorized",
      );
      assert.equal(error.message, "Unauthorized access");
      assert.equal(error.status, 401);
      assert.equal(error.code, "unauthorized");
      assert.equal(error.name, "StateClientError");
      assert.equal(error.conflict, undefined);
    });

    it("should correctly instantiate with optional conflict parameter", () => {
      const conflictData = {
        currentData: { id: 1 },
        currentVersion: "v1",
        conflict: "Version mismatch",
      };
      const error = new StateClientError(
        "Conflict occurred",
        409,
        "conflict",
        conflictData,
      );
      assert.equal(error.message, "Conflict occurred");
      assert.equal(error.status, 409);
      assert.equal(error.code, "conflict");
      assert.equal(error.name, "StateClientError");
      assert.deepEqual(error.conflict, conflictData);
    });
  });
});
