import { describe, it } from "node:test";
import assert from "node:assert";
import { cleanEnvValue, needsSsl, createPostgresPool } from "./dbCommon.js";

describe("needsSsl", () => {
  it("should return false for disabled or allowed sslmode", () => {
    assert.strictEqual(needsSsl("postgres://user:pass@neon.tech/db?sslmode=disable"), false);
    assert.strictEqual(needsSsl("postgres://user:pass@neon.tech/db?sslmode=allow"), false);
  });

  it("should return true for cloud hosts when sslmode is not disable/allow", () => {
    assert.strictEqual(needsSsl("postgres://user:pass@neon.tech/db"), true);
    assert.strictEqual(needsSsl("postgres://user:pass@supabase.co/db"), true);
    assert.strictEqual(needsSsl("postgres://user:pass@railway.app/db"), true);
  });

  it("should return false for non-cloud hosts or invalid URLs", () => {
    assert.strictEqual(needsSsl("postgres://user:pass@localhost:5432/db"), false);
    assert.strictEqual(needsSsl("not-a-url"), false);
  });
});

describe("createPostgresPool", () => {
  it("should configure ssl with rejectUnauthorized: true when needsSsl is true", () => {
    const pool = createPostgresPool("postgres://user:pass@neon.tech/db");
    assert.deepStrictEqual((pool.options as any).ssl, { rejectUnauthorized: true });
  });

  it("should not configure ssl when needsSsl is false", () => {
    const pool = createPostgresPool("postgres://user:pass@localhost:5432/db");
    assert.strictEqual((pool.options as any).ssl, undefined);
  });
});


describe("cleanEnvValue", () => {
  it("should handle undefined", () => {
    assert.strictEqual(cleanEnvValue(undefined), "");
  });

  it("should handle empty string", () => {
    assert.strictEqual(cleanEnvValue(""), "");
  });

  it("should handle string with spaces", () => {
    assert.strictEqual(cleanEnvValue("  hello  "), "hello");
  });

  it("should handle single quotes", () => {
    assert.strictEqual(cleanEnvValue("'hello'"), "hello");
  });

  it("should handle double quotes", () => {
    assert.strictEqual(cleanEnvValue('"hello"'), "hello");
  });

  it("should handle nested quotes", () => {
    assert.strictEqual(cleanEnvValue("'\"hello\"'"), "hello");
  });

  it("should handle unmatched quotes", () => {
    assert.strictEqual(cleanEnvValue("\"hello'"), "\"hello'");
    assert.strictEqual(cleanEnvValue("'hello\""), "'hello\"");
  });

  it("should handle whitespace inside quotes", () => {
    assert.strictEqual(cleanEnvValue('"  hello  "'), "hello");
  });

  it("should handle empty quotes", () => {
    assert.strictEqual(cleanEnvValue('""'), "");
    assert.strictEqual(cleanEnvValue("''"), "");
  });
});
