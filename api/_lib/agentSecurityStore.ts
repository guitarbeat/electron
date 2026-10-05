import { createHash, randomUUID } from "node:crypto";
import type pg from "pg";
import { createPostgresPool, getDatabaseUrl } from "./dbCommon.js";

let pool: pg.Pool | null = null;
let poolUrl = "";
let schemaReady: Promise<void> | null = null;
const memoryRates = new Map<string, number[]>();
const memoryConfirmations = new Set<string>();
const memoryAudit: unknown[] = [];

const getPool = (): pg.Pool => {
  const url = getDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL is not configured.");
  if (!pool || poolUrl !== url) {
    if (pool) void pool.end().catch(() => undefined);
    pool = createPostgresPool(url);
    poolUrl = url;
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
    CREATE TABLE IF NOT EXISTS agent_rate_limits (
      rate_key text NOT NULL,
      occurred_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS agent_rate_limits_lookup
      ON agent_rate_limits (rate_key, occurred_at);
    CREATE TABLE IF NOT EXISTS agent_confirmation_uses (
      token_id text PRIMARY KEY,
      used_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS agent_audit_events (
      id uuid PRIMARY KEY,
      request_id text NOT NULL,
      actor text,
      operation text NOT NULL,
      outcome text NOT NULL,
      occurred_at timestamptz NOT NULL DEFAULT now()
    )
  `).then(() => undefined);
  await schemaReady;
};

const useMemory = (): boolean =>
  process.env.NODE_ENV === "test" || !getDatabaseUrl();

export const consumeAnonymousRateLimit = async (
  ip: string,
  now = Date.now(),
  limit = 10,
  windowMs = 60 * 60 * 1000,
): Promise<boolean> => {
  const key = createHash("sha256").update(ip).digest("hex");
  if (useMemory()) {
    const recent = (memoryRates.get(key) ?? []).filter(
      (time) => time > now - windowMs,
    );
    if (recent.length >= limit) return false;
    recent.push(now);
    memoryRates.set(key, recent);
    return true;
  }
  await ensureSchema();
  const rows = await query<{ allowed: boolean }>(
    `WITH lock AS (
      SELECT pg_advisory_xact_lock(hashtext($1))
    ),
    cleanup AS (
      DELETE FROM agent_rate_limits
      WHERE occurred_at < $2
      AND (SELECT 1 FROM lock) IS NOT NULL
    ),
    current_count AS (
      SELECT count(*)::int AS cnt
      FROM agent_rate_limits
      WHERE rate_key = $1 AND occurred_at >= $2
      AND (SELECT 1 FROM lock) IS NOT NULL
    ),
    inserted AS (
      INSERT INTO agent_rate_limits (rate_key, occurred_at)
      SELECT $1, $3
      FROM current_count
      WHERE cnt < $4
      RETURNING 1
    )
    SELECT EXISTS(SELECT 1 FROM inserted) AS allowed;`,
    [key, new Date(now - windowMs), new Date(now), limit],
  );
  return rows[0]?.allowed === true;
};

export const consumeConfirmation = async (
  tokenId: string,
): Promise<boolean> => {
  if (useMemory()) {
    if (memoryConfirmations.has(tokenId)) return false;
    memoryConfirmations.add(tokenId);
    return true;
  }
  await ensureSchema();
  const rows = await query<{ token_id: string }>(
    "INSERT INTO agent_confirmation_uses (token_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING token_id",
    [tokenId],
  );
  return rows.length === 1;
};

export const recordAgentAudit = async (event: {
  requestId: string;
  actor: string | null;
  operation: string;
  outcome: string;
}): Promise<void> => {
  if (useMemory()) {
    memoryAudit.push({ ...event, id: randomUUID() });
    return;
  }
  await ensureSchema();
  await query(
    "INSERT INTO agent_audit_events (id, request_id, actor, operation, outcome) VALUES ($1, $2, $3, $4, $5)",
    [
      randomUUID(),
      event.requestId,
      event.actor,
      event.operation,
      event.outcome,
    ],
  );
};

export const resetAgentSecurityStoreForTests = (): void => {
  memoryRates.clear();
  memoryConfirmations.clear();
  memoryAudit.length = 0;
};
