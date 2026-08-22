import test from "node:test";
import assert from "node:assert/strict";
import { getErrorMessage } from "../../utils/shared.ts";

test("MoviesView recommendation error messages use getErrorMessage", async (t) => {
  await t.test("returns Error message", () => {
    assert.equal(
      getErrorMessage(new Error("Network timeout"), "Failed to send suggestion"),
      "Network timeout",
    );
  });

  await t.test("returns fallback for non-Error values", () => {
    assert.equal(
      getErrorMessage("Something went wrong", "Failed to send suggestion"),
      "Failed to send suggestion",
    );
    assert.equal(
      getErrorMessage(null, "Failed to send suggestion"),
      "Failed to send suggestion",
    );
  });
});
