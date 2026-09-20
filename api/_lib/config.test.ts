import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveConfig } from "./config.js";

describe("resolveConfig", () => {
  it("returns trimmed value when a valid string is provided", () => {
    assert.equal(resolveConfig("production", "development"), "production");
  });

  it("trims leading and trailing whitespace from the provided value", () => {
    assert.equal(resolveConfig("  custom_value  ", "fallback_value"), "custom_value");
  });

  it("trims newlines and tabs from the provided value while preserving internal spaces", () => {
    assert.equal(resolveConfig("\n\t hello world \r\n", "fallback"), "hello world");
  });

  it("returns fallback when value is undefined", () => {
    assert.equal(resolveConfig(undefined, "fallback_value"), "fallback_value");
  });

  it("returns fallback when value is an empty string", () => {
    assert.equal(resolveConfig("", "fallback_value"), "fallback_value");
  });

  it("returns fallback when value is a whitespace-only string containing spaces, tabs, or newlines", () => {
    assert.equal(resolveConfig("    ", "fallback_value"), "fallback_value");
    assert.equal(resolveConfig("\t \n \r ", "fallback_value"), "fallback_value");
  });

  it("returns fallback even if fallback is an empty string", () => {
    assert.equal(resolveConfig("   ", ""), "");
    assert.equal(resolveConfig(undefined, ""), "");
  });

  it("resolves values directly from environment variable inputs", () => {
    try {
      process.env.TEST_RESOLVE_CONFIG_VAR = "  env_override  ";
      assert.equal(resolveConfig(process.env.TEST_RESOLVE_CONFIG_VAR, "fallback"), "env_override");
      assert.equal(resolveConfig(process.env.NON_EXISTENT_VAR, "fallback"), "fallback");
    } finally {
      delete process.env.TEST_RESOLVE_CONFIG_VAR;
    }
  });
});
