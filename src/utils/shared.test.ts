import test from "node:test";
import assert from "node:assert/strict";
import { getErrorMessage } from "./shared.ts";

test("getErrorMessage", async (t) => {
  await t.test("returns sanitized error message for an Error instance", () => {
    const error = new Error("   Bad Request  \x00 ");
    assert.equal(getErrorMessage(error), "Bad Request");
  });

  await t.test("returns fallback if error message becomes empty after sanitization", () => {
    const error = new Error("   \x00 ");
    assert.equal(getErrorMessage(error), "Something went wrong.");
  });

  await t.test("returns custom fallback if error message becomes empty after sanitization", () => {
    const error = new Error("   \x00 ");
    assert.equal(getErrorMessage(error, "Custom fallback"), "Custom fallback");
  });

  await t.test("returns default fallback for non-Error object", () => {
    assert.equal(getErrorMessage({ status: 500 }), "Something went wrong.");
  });

  await t.test("returns custom fallback for non-Error object", () => {
    assert.equal(getErrorMessage({ status: 500 }, "Custom error"), "Custom error");
  });

  await t.test("returns default fallback for string error", () => {
    assert.equal(getErrorMessage("String error"), "Something went wrong.");
  });

  await t.test("returns default fallback for null", () => {
    assert.equal(getErrorMessage(null), "Something went wrong.");
  });

  await t.test("returns default fallback for undefined", () => {
    assert.equal(getErrorMessage(undefined), "Something went wrong.");
  });
});
