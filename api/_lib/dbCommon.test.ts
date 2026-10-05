import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  cleanEnvValue,
  getDatabaseUrl,
  needsSsl,
  createPostgresPool,
  cleanDatabaseUrl,
} from "./dbCommon.js";

describe("getDatabaseUrl", () => {
  let originalDatabaseUrl: string | undefined;
  let originalPostgresUrl: string | undefined;
  let originalPostgresPrismaUrl: string | undefined;

  const restoreEnv = () => {
    if (originalDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }

    if (originalPostgresUrl !== undefined) {
      process.env.POSTGRES_URL = originalPostgresUrl;
    } else {
      delete process.env.POSTGRES_URL;
    }

    if (originalPostgresPrismaUrl !== undefined) {
      process.env.POSTGRES_PRISMA_URL = originalPostgresPrismaUrl;
    } else {
      delete process.env.POSTGRES_PRISMA_URL;
    }
  };

  beforeEach(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    originalPostgresUrl = process.env.POSTGRES_URL;
    originalPostgresPrismaUrl = process.env.POSTGRES_PRISMA_URL;
  });

  afterEach(() => {
    restoreEnv();
  });

  it("should return DATABASE_URL when available", () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db1";
    process.env.POSTGRES_URL = "postgres://user:pass@localhost:5432/db2";
    process.env.POSTGRES_PRISMA_URL = "postgres://user:pass@localhost:5432/db3";

    assert.strictEqual(
      getDatabaseUrl(),
      "postgres://user:pass@localhost:5432/db1",
    );
  });

  it("should fallback to POSTGRES_URL when DATABASE_URL is not set", () => {
    delete process.env.DATABASE_URL;
    process.env.POSTGRES_URL = "postgres://user:pass@localhost:5432/db2";
    process.env.POSTGRES_PRISMA_URL = "postgres://user:pass@localhost:5432/db3";

    assert.strictEqual(
      getDatabaseUrl(),
      "postgres://user:pass@localhost:5432/db2",
    );
  });

  it("should fallback to POSTGRES_PRISMA_URL when DATABASE_URL and POSTGRES_URL are not set", () => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    process.env.POSTGRES_PRISMA_URL = "postgres://user:pass@localhost:5432/db3";

    assert.strictEqual(
      getDatabaseUrl(),
      "postgres://user:pass@localhost:5432/db3",
    );
  });

  it("should return empty string when no environment variables are set", () => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.POSTGRES_PRISMA_URL;

    assert.strictEqual(getDatabaseUrl(), "");
  });

  it("should clean quotes and trim whitespace from env values", () => {
    process.env.DATABASE_URL = ' "postgres://user:pass@localhost:5432/db1" ';

    assert.strictEqual(
      getDatabaseUrl(),
      "postgres://user:pass@localhost:5432/db1",
    );
  });
});

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

  it("should pass verify-full instead of alias ssl modes so pg does not warn", () => {
    const pool = createPostgresPool(
      "postgres://user:pass@neon.tech/db?sslmode=require",
    );
    const connectionString = String((pool.options as { connectionString?: string }).connectionString);
    const sslmode = new URL(connectionString).searchParams.get("sslmode");
    assert.strictEqual(sslmode, "verify-full");
  });
});

describe("cleanDatabaseUrl", () => {
  it("should rewrite prefer, require, and verify-ca to verify-full", () => {
    assert.strictEqual(
      new URL(cleanDatabaseUrl("postgres://user:pass@neon.tech/db?sslmode=require")).searchParams.get("sslmode"),
      "verify-full",
    );
    assert.strictEqual(
      new URL(cleanDatabaseUrl("postgres://user:pass@neon.tech/db?sslmode=prefer")).searchParams.get("sslmode"),
      "verify-full",
    );
    assert.strictEqual(
      new URL(cleanDatabaseUrl("postgres://user:pass@neon.tech/db?sslmode=verify-ca")).searchParams.get("sslmode"),
      "verify-full",
    );
  });

  it("should leave disable, allow, and verify-full unchanged", () => {
    assert.strictEqual(
      new URL(cleanDatabaseUrl("postgres://user:pass@localhost/db?sslmode=disable")).searchParams.get("sslmode"),
      "disable",
    );
    assert.strictEqual(
      new URL(cleanDatabaseUrl("postgres://user:pass@localhost/db?sslmode=allow")).searchParams.get("sslmode"),
      "allow",
    );
    assert.strictEqual(
      new URL(cleanDatabaseUrl("postgres://user:pass@neon.tech/db?sslmode=verify-full")).searchParams.get("sslmode"),
      "verify-full",
    );
  });

  it("should still drop channel_binding", () => {
    const cleaned = cleanDatabaseUrl(
      "postgres://user:pass@neon.tech/db?channel_binding=require&sslmode=require",
    );
    const parsed = new URL(cleaned);
    assert.strictEqual(parsed.searchParams.get("channel_binding"), null);
    assert.strictEqual(parsed.searchParams.get("sslmode"), "verify-full");
  });

  it("should return the original string when the url is invalid", () => {
    assert.strictEqual(cleanDatabaseUrl("not-a-url"), "not-a-url");
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
