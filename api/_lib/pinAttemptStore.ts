/**
 * Server-side PIN brute-force tracking backed by Postgres.
 *
 * Replaces the previous cookie-only approach where a client could bypass
 * the lockout by simply deleting the `movie_watch_pin_attempt` cookie.
 * The database row is now the authoritative source of truth; the cookie
 * continues to be issued for client-side countdown UX only.
 */

import type pg from "pg";
import { createPostgresPool, getDatabaseUrl } from "./dbCommon.js";

let pool: pg.Pool | null = null;
let poolUrl = "";
let schemaReady: Promise<void> | null = null;

const getPool = (): pg.Pool => {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  if (!pool || poolUrl !== databaseUrl) {
    if (pool) void pool.end().catch(() => undefined);
    pool = createPostgresPool(databaseUrl);
    poolUrl = databaseUrl;
    schemaReady = null;
  }
  return pool;
};

const query = async <T extends object>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> => {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return (result.rows ?? []) as T[];
  } finally {
    client.release();
  }
};

const ensureSchema = async (): Promise<void> => {
  schemaReady ??= query(`
    CREATE TABLE IF NOT EXISTS pin_attempts (
      user_name    TEXT PRIMARY KEY,
      failures     INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `).then(() => undefined);
  await schemaReady;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PinAttemptRecord {
  failures: number;
  /** Epoch milliseconds, or null if not currently locked. */
  lockedUntil: number | null;
}

/**
 * Returns the current failure count and lock expiry for a user.
 * Fails silently (returns zeroed record) so a DB outage never blocks login.
 */
export const getPinAttemptRecord = async (
  user: string,
): Promise<PinAttemptRecord> => {
  if (!getDatabaseUrl()) {
    return { failures: 0, lockedUntil: null };
  }
  try {
    await ensureSchema();
    const rows = await query<{ failures: number; locked_until: string | null }>(
      "SELECT failures, locked_until FROM pin_attempts WHERE user_name = $1",
      [user],
    );
    const row = rows[0];
    if (!row) return { failures: 0, lockedUntil: null };
    return {
      failures: row.failures,
      lockedUntil: row.locked_until
        ? new Date(row.locked_until).getTime()
        : null,
    };
  } catch (error) {
    console.error(
      "[pinAttemptStore] Failed to read pin attempt record:",
      error,
    );
    // Fail closed: deny access when we cannot verify the actual lockout state.
    // This prevents an attacker from exploiting transient DB failures to bypass lockout.
    return { failures: Infinity, lockedUntil: Date.now() + 60_000 };
  }
};

/**
 * Atomically upserts the failure count and lock expiry for a user.
 */
export const recordPinFailure = async (
  user: string,
  failures: number,
  lockedUntil: number | null,
): Promise<void> => {
  if (!getDatabaseUrl()) return;

  try {
    await ensureSchema();
    await query(
      `INSERT INTO pin_attempts (user_name, failures, locked_until, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_name) DO UPDATE SET
         failures     = EXCLUDED.failures,
         locked_until = EXCLUDED.locked_until,
         updated_at   = now()`,
      [user, failures, lockedUntil ? new Date(lockedUntil) : null],
    );
  } catch (error) {
    console.error("[pinAttemptStore] Failed to record pin failure:", error);
  }
};

/**
 * Resets the failure counter and clears any active lockout for a user.
 * Called after a successful PIN verification.
 */
export const clearPinAttempts = async (user: string): Promise<void> => {
  if (!getDatabaseUrl()) return;

  try {
    await ensureSchema();
    await query(
      `INSERT INTO pin_attempts (user_name, failures, locked_until, updated_at)
       VALUES ($1, 0, NULL, now())
       ON CONFLICT (user_name) DO UPDATE SET
         failures     = 0,
         locked_until = NULL,
         updated_at   = now()`,
      [user],
    );
  } catch (error) {
    console.error("[pinAttemptStore] Failed to clear pin attempts:", error);
  }
};
