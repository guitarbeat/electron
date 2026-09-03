import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveConfig } from "./config.js";

describe("resolveConfig", () => {
  it("returns trimmed value when a valid string is provided", () => {
    assert.equal(resolveConfig("production", "development"), "production");
  });

  it("trims whitespace from the provided value", () => {
    assert.equal(resolveConfig("  custom_value  ", "fallback_value"), "custom_value");
  });

  it("returns fallback when value is undefined", () => {
    assert.equal(resolveConfig(undefined, "fallback_value"), "fallback_value");
  });

  it("returns fallback when value is an empty string", () => {
    assert.equal(resolveConfig("", "fallback_value"), "fallback_value");
  });

  it("returns fallback when value is whitespace-only string", () => {
    assert.equal(resolveConfig("    ", "fallback_value"), "fallback_value");
  });
});
