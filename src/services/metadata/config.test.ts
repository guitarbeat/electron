import assert from "node:assert/strict";
import test from "node:test";
import { resolveConfig } from "./config.ts";

test("resolveConfig", async (t) => {
  await t.test("returns fallback when value is undefined", () => {
    assert.equal(resolveConfig(undefined, "fallback"), "fallback");
  });

  await t.test("returns fallback when value is empty string", () => {
    assert.equal(resolveConfig("", "fallback"), "fallback");
  });

  await t.test("returns fallback when value is whitespace only", () => {
    assert.equal(resolveConfig("   ", "fallback"), "fallback");
  });

  await t.test(
    "returns cleaned value when it has leading/trailing spaces",
    () => {
      assert.equal(resolveConfig("  valid-value  ", "fallback"), "valid-value");
    },
  );

  await t.test("returns cleaned value when it has quotes", () => {
    assert.equal(resolveConfig('"valid-value"', "fallback"), "valid-value");
    assert.equal(resolveConfig("'valid-value'", "fallback"), "valid-value");
  });

  await t.test("returns cleaned value when it has quotes and spaces", () => {
    assert.equal(resolveConfig('  "valid-value"  ', "fallback"), "valid-value");
    assert.equal(resolveConfig("  'valid-value'  ", "fallback"), "valid-value");
  });

  await t.test(
    "returns fallback when cleaned value is empty string (e.g. quotes only)",
    () => {
      assert.equal(resolveConfig('""', "fallback"), "fallback");
      assert.equal(resolveConfig("''", "fallback"), "fallback");
      assert.equal(resolveConfig('  ""  ', "fallback"), "fallback");
    },
  );

  await t.test(
    "returns fallback when cleaned value is empty string (e.g. single quote only)",
    () => {
      assert.equal(resolveConfig('"', "fallback"), "fallback");
      assert.equal(resolveConfig("'", "fallback"), "fallback");
    },
  );
});

test("exported constants (default environment)", async (t) => {
  const config = await import("./config.ts");

  await t.test("OMDB_API_KEY is evaluated correctly", () => {
    // In Node test environment, import.meta.env is usually undefined, so it defaults to ''
    assert.equal(config.OMDB_API_KEY, "");
  });

  await t.test("OMDB_BASE defaults to OMDB_DEFAULT_BASE_URL", () => {
    assert.equal(config.OMDB_BASE, config.OMDB_DEFAULT_BASE_URL);
  });

  await t.test("TVMAZE_BASE defaults to TVMAZE_DEFAULT_BASE_URL", () => {
    assert.equal(config.TVMAZE_BASE, config.TVMAZE_DEFAULT_BASE_URL);
  });

  await t.test("timeout and limits are exported correctly", () => {
    assert.equal(config.METADATA_REQUEST_TIMEOUT_MS, 5000);
    assert.equal(config.AUTOCOMPLETE_REQUEST_TIMEOUT_MS, 2500);
    assert.equal(config.MOVIE_AUTOCOMPLETE_RESULT_LIMIT, 10);
    assert.equal(config.MOVIE_AUTOCOMPLETE_RESULTS_PER_SOURCE_LIMIT, 5);
  });

  await t.test("failure codes are exported correctly", () => {
    assert.equal(config.OMDB_AUTH_FAILURE_CODE, "omdb_auth");
    assert.equal(config.OMDB_CONFIG_FAILURE_CODE, "omdb_config");
  });
});
