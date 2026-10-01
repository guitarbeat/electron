import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import pg from "pg";
import {
  consumeAnonymousRateLimit,
  consumeConfirmation,
  recordAgentAudit,
  resetAgentSecurityStoreForTests,
} from "./agentSecurityStore.js";

describe("agentSecurityStore (in-memory mode)", () => {
  beforeEach(() => {
    resetAgentSecurityStoreForTests();
  });

  it("enforces rate limits in memory", async () => {
    const ip = "192.168.1.100";
    const now = Date.now();
    const limit = 3;

    assert.strictEqual(await consumeAnonymousRateLimit(ip, now, limit), true);
    assert.strictEqual(await consumeAnonymousRateLimit(ip, now, limit), true);
    assert.strictEqual(await consumeAnonymousRateLimit(ip, now, limit), true);
    assert.strictEqual(await consumeAnonymousRateLimit(ip, now, limit), false);
  });

  it("evicts expired entries outside windowMs", async () => {
    const ip = "192.168.1.101";
    const now = Date.now();
    const limit = 2;
    const windowMs = 1000;

    assert.strictEqual(
      await consumeAnonymousRateLimit(ip, now - 2000, limit, windowMs),
      true,
    );
    assert.strictEqual(
      await consumeAnonymousRateLimit(ip, now - 1500, limit, windowMs),
      true,
    );
    assert.strictEqual(
      await consumeAnonymousRateLimit(ip, now, limit, windowMs),
      true,
    );
  });

  it("consumes confirmation token once", async () => {
    assert.strictEqual(await consumeConfirmation("token-123"), true);
    assert.strictEqual(await consumeConfirmation("token-123"), false);
  });

  it("records agent audit events", async () => {
    await recordAgentAudit({
      requestId: "req-1",
      actor: "user-1",
      operation: "test",
      outcome: "success",
    });
  });
});

describe("agentSecurityStore (database query mode)", () => {
  let origEnv: string | undefined;
  let origDbUrl: string | undefined;

  beforeEach(() => {
    origEnv = process.env.NODE_ENV;
    origDbUrl = process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it("executes exactly 1 DB query per rate limit evaluation", async (t) => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";

    const executedQueries: Array<{ sql: string; params?: unknown[] }> = [];

    const mockClient = {
      query: async (sql: string, params?: unknown[]) => {
        executedQueries.push({ sql, params });
        if (sql.includes("CREATE TABLE")) {
          return { rows: [] };
        }
        if (sql.includes("WITH lock AS")) {
          return { rows: [{ allowed: true }] };
        }
        return { rows: [] };
      },
      release: () => {},
    };

    t.mock.method(pg.Pool.prototype, "connect", async () => mockClient as any);

    const result = await consumeAnonymousRateLimit(
      "203.0.113.1",
      Date.now(),
      5,
      60000,
    );
    assert.strictEqual(result, true);

    const rateLimitQueries = executedQueries.filter(
      (q) => !q.sql.includes("CREATE TABLE"),
    );
    console.log(
      `[Optimized] Rate limit evaluation executed ${rateLimitQueries.length} DB query`,
    );
    assert.strictEqual(
      rateLimitQueries.length,
      1,
      "Expected exactly 1 query to be executed",
    );
    assert.ok(
      rateLimitQueries[0].sql.includes("WITH lock AS"),
      "Query should be the single CTE statement",
    );
  });

  it("returns false when CTE returns allowed: false", async (t) => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";

    const mockClient = {
      query: async (sql: string) => {
        if (sql.includes("CREATE TABLE")) {
          return { rows: [] };
        }
        if (sql.includes("WITH lock AS")) {
          return { rows: [{ allowed: false }] };
        }
        return { rows: [] };
      },
      release: () => {},
    };

    t.mock.method(pg.Pool.prototype, "connect", async () => mockClient as any);

    const result = await consumeAnonymousRateLimit(
      "203.0.113.1",
      Date.now(),
      5,
      60000,
    );
    assert.strictEqual(result, false);
  });
});
