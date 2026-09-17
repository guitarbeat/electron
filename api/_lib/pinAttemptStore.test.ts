import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";
import pg from "pg";
import {
  getPinAttemptRecord,
  recordPinFailure,
  clearPinAttempts,
} from "./pinAttemptStore.js";

describe("pinAttemptStore", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  describe("when DATABASE_URL is not set", () => {
    it("getPinAttemptRecord returns default zero record", async () => {
      const record = await getPinAttemptRecord("user1");
      assert.deepStrictEqual(record, { failures: 0, lockedUntil: null });
    });

    it("recordPinFailure returns without performing queries", async () => {
      let connectCalled = false;
      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          connectCalled = true;
          return {
            query: async () => ({ rows: [] }),
            release: () => {},
          };
        },
      );

      try {
        await recordPinFailure("user1", 3, Date.now() + 60000);
        assert.strictEqual(connectCalled, false);
      } finally {
        connectMock.mock.restore();
      }
    });

    it("clearPinAttempts returns without performing queries", async () => {
      let connectCalled = false;
      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          connectCalled = true;
          return {
            query: async () => ({ rows: [] }),
            release: () => {},
          };
        },
      );

      try {
        await clearPinAttempts("user1");
        assert.strictEqual(connectCalled, false);
      } finally {
        connectMock.mock.restore();
      }
    });
  });

  describe("when DATABASE_URL is configured", () => {
    beforeEach(() => {
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    });

    it("ensures schema and fetches record when row exists", async () => {
      const executedQueries: { sql: string; params?: unknown[] }[] = [];
      const lockedDateStr = "2025-01-01T12:00:00.000Z";

      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function (this: any) {
          return {
            query: async (sql: string | { text: string }, params?: unknown[]) => {
              const sqlStr = typeof sql === "string" ? sql : sql?.text ?? "";
              executedQueries.push({ sql: sqlStr, params });

              if (sqlStr.includes("CREATE TABLE IF NOT EXISTS pin_attempts")) {
                return { rows: [] };
              }
              if (sqlStr.includes("SELECT failures, locked_until FROM pin_attempts")) {
                return {
                  rows: [
                    { failures: 3, locked_until: lockedDateStr },
                  ],
                };
              }
              return { rows: [] };
            },
            release: () => {},
          };
        },
      );

      try {
        const record = await getPinAttemptRecord("user1");
        assert.deepStrictEqual(record, {
          failures: 3,
          lockedUntil: new Date(lockedDateStr).getTime(),
        });

        const hasSchemaQuery = executedQueries.some((q) =>
          q.sql.includes("CREATE TABLE IF NOT EXISTS pin_attempts"),
        );
        const hasSelectQuery = executedQueries.some((q) =>
          q.sql.includes("SELECT failures, locked_until FROM pin_attempts"),
        );
        assert.strictEqual(hasSchemaQuery, true);
        assert.strictEqual(hasSelectQuery, true);
      } finally {
        connectMock.mock.restore();
      }
    });

    it("returns zero record when no row exists for user", async () => {
      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          return {
            query: async (sql: string | { text: string }) => {
              const sqlStr = typeof sql === "string" ? sql : sql?.text ?? "";
              if (sqlStr.includes("SELECT failures, locked_until FROM pin_attempts")) {
                return { rows: [] };
              }
              return { rows: [] };
            },
            release: () => {},
          };
        },
      );

      try {
        const record = await getPinAttemptRecord("nonexistent");
        assert.deepStrictEqual(record, { failures: 0, lockedUntil: null });
      } finally {
        connectMock.mock.restore();
      }
    });

    it("handles null locked_until in database row", async () => {
      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          return {
            query: async (sql: string | { text: string }) => {
              const sqlStr = typeof sql === "string" ? sql : sql?.text ?? "";
              if (sqlStr.includes("SELECT failures, locked_until FROM pin_attempts")) {
                return { rows: [{ failures: 2, locked_until: null }] };
              }
              return { rows: [] };
            },
            release: () => {},
          };
        },
      );

      try {
        const record = await getPinAttemptRecord("user1");
        assert.deepStrictEqual(record, { failures: 2, lockedUntil: null });
      } finally {
        connectMock.mock.restore();
      }
    });

    it("returns fail-closed state on DB error", async () => {
      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          throw new Error("DB Connection Error");
        },
      );

      try {
        const record = await getPinAttemptRecord("user1");
        assert.strictEqual(record.failures, Infinity);
        assert.ok(record.lockedUntil! > Date.now());
      } finally {
        connectMock.mock.restore();
      }
    });

    it("records pin failure with lockedUntil timestamp", async () => {
      const executedQueries: { sql: string; params?: unknown[] }[] = [];
      const lockTime = Date.now() + 60000;

      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          return {
            query: async (sql: string | { text: string }, params?: unknown[]) => {
              const sqlStr = typeof sql === "string" ? sql : sql?.text ?? "";
              executedQueries.push({ sql: sqlStr, params });
              return { rows: [] };
            },
            release: () => {},
          };
        },
      );

      try {
        await recordPinFailure("user1", 3, lockTime);

        const upsertQuery = executedQueries.find((q) =>
          q.sql.includes("INSERT INTO pin_attempts"),
        );
        assert.ok(upsertQuery);
        assert.strictEqual(upsertQuery.params?.[0], "user1");
        assert.strictEqual(upsertQuery.params?.[1], 3);
        assert.deepStrictEqual(upsertQuery.params?.[2], new Date(lockTime));
      } finally {
        connectMock.mock.restore();
      }
    });

    it("records pin failure with null lockedUntil", async () => {
      const executedQueries: { sql: string; params?: unknown[] }[] = [];

      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          return {
            query: async (sql: string | { text: string }, params?: unknown[]) => {
              const sqlStr = typeof sql === "string" ? sql : sql?.text ?? "";
              executedQueries.push({ sql: sqlStr, params });
              return { rows: [] };
            },
            release: () => {},
          };
        },
      );

      try {
        await recordPinFailure("user1", 1, null);

        const upsertQuery = executedQueries.find((q) =>
          q.sql.includes("INSERT INTO pin_attempts"),
        );
        assert.ok(upsertQuery);
        assert.strictEqual(upsertQuery.params?.[0], "user1");
        assert.strictEqual(upsertQuery.params?.[1], 1);
        assert.strictEqual(upsertQuery.params?.[2], null);
      } finally {
        connectMock.mock.restore();
      }
    });

    it("catches errors silently in recordPinFailure", async () => {
      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          throw new Error("DB Error");
        },
      );

      try {
        await assert.doesNotReject(async () => {
          await recordPinFailure("user1", 1, null);
        });
      } finally {
        connectMock.mock.restore();
      }
    });

    it("clears pin attempts for a user", async () => {
      const executedQueries: { sql: string; params?: unknown[] }[] = [];

      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          return {
            query: async (sql: string | { text: string }, params?: unknown[]) => {
              const sqlStr = typeof sql === "string" ? sql : sql?.text ?? "";
              executedQueries.push({ sql: sqlStr, params });
              return { rows: [] };
            },
            release: () => {},
          };
        },
      );

      try {
        await clearPinAttempts("user1");

        const clearQuery = executedQueries.find((q) =>
          q.sql.includes("INSERT INTO pin_attempts"),
        );
        assert.ok(clearQuery);
        assert.strictEqual(clearQuery.params?.[0], "user1");
      } finally {
        connectMock.mock.restore();
      }
    });

    it("catches errors silently in clearPinAttempts", async () => {
      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function () {
          throw new Error("DB Error");
        },
      );

      try {
        await assert.doesNotReject(async () => {
          await clearPinAttempts("user1");
        });
      } finally {
        connectMock.mock.restore();
      }
    });
  });
});
