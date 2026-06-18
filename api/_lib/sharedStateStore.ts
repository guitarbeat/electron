import pg from 'pg';

const { Pool } = pg;

const CACHE_TTL_MS = 30000;

export interface SharedStateFileRecord {
  exists: boolean;
  content: string | null;
}

interface CachedEntry {
  expiresAt: number;
  exists: boolean;
  content: string | null;
}

const fileCache = new Map<string, CachedEntry>();
let pool: pg.Pool | null = null;
let poolUrl = '';
let schemaReady: Promise<void> | null = null;
let testStore: Map<string, string> | null = null;
let testPatchBodies: string[] | null = null;

const cleanEnvValue = (value: string | undefined): string => {
  let normalized = (value || '').trim();

  while (
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
};

const getDatabaseUrl = (): string =>
  cleanEnvValue(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL
    // NOTE: VITE_DATABASE_URL is intentionally excluded here. VITE_* variables
    // are bundled into the client-side JavaScript by Vite, which would expose
    // the connection string to every browser. Use DATABASE_URL (server-only).
  );

const needsSsl = (url: string): boolean => {
  try {
    const u = new URL(url);
    const sslmode = u.searchParams.get('sslmode');
    if (sslmode === 'disable' || sslmode === 'allow') return false;
    // Neon, Supabase, Railway, and most cloud Postgres hosts require SSL.
    const cloudHosts = ['neon.tech', 'supabase.co', 'railway.app', 'render.com', 'amazonaws.com'];
    return cloudHosts.some((h) => u.hostname.includes(h));
  } catch {
    return false;
  }
};

const getPool = (): pg.Pool => {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!pool || poolUrl !== databaseUrl) {
    if (pool) {
      void pool.end().catch(() => undefined);
    }
    const poolConfig: pg.PoolConfig = { connectionString: databaseUrl };
    if (needsSsl(databaseUrl)) {
      poolConfig.ssl = { rejectUnauthorized: true };
    }
    pool = new Pool(poolConfig);
    poolUrl = databaseUrl;
    schemaReady = null;
  }
  return pool;
};

const query = async <T extends object>(
  sql: string,
  params: unknown[] = []
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
    CREATE TABLE IF NOT EXISTS shared_state_files (
      filename text PRIMARY KEY,
      content text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `).then(() => undefined);
  await schemaReady;
};

/** Returns true when the server has Postgres credentials for read/write. */
export const isSharedStateConfigured = (): boolean => Boolean(testStore || getDatabaseUrl());

/** Same as {@link isSharedStateConfigured}; writes use the same database URL. */
export const isSharedStateWriteConfigured = (): boolean => isSharedStateConfigured();

export const invalidateSharedStateCache = (): void => {
  fileCache.clear();
};

export const installSharedStateMemoryStoreForTests = (
  initialFiles: Record<string, string>
): { getFile: (filename: string) => string | undefined; patchBodies: string[]; dispose: () => void } => {
  const previousStore = testStore;
  const previousPatchBodies = testPatchBodies;
  const store = new Map(Object.entries(initialFiles));
  const patchBodies: string[] = [];
  testStore = store;
  testPatchBodies = patchBodies;
  invalidateSharedStateCache();

  return {
    getFile: (filename: string) => store.get(filename),
    patchBodies,
    dispose: () => {
      testStore = previousStore;
      testPatchBodies = previousPatchBodies;
      invalidateSharedStateCache();
    },
  };
};

const readFromDatabase = async (filename: string): Promise<SharedStateFileRecord> => {
  if (testStore) {
    if (!testStore.has(filename)) {
      return { exists: false, content: null };
    }
    return { exists: true, content: testStore.get(filename) ?? '' };
  }

  await ensureSchema();
  const rows = await query<{ content: string }>(
    'SELECT content FROM shared_state_files WHERE filename = $1 LIMIT 1',
    [filename]
  );

  const row = rows[0];
  if (!row) {
    return { exists: false, content: null };
  }
  return {
    exists: true,
    content: row.content,
  };
};

export const readSharedStateFile = async (
  filename: string,
  options: { bypassCache?: boolean } = {}
): Promise<string | null> => {
  const record = await readSharedStateFileRecord(filename, options);
  return record.content;
};

export const readSharedStateFileRecord = async (
  filename: string,
  options: { bypassCache?: boolean } = {}
): Promise<SharedStateFileRecord> => {
  if (!isSharedStateConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!options.bypassCache) {
    const hit = fileCache.get(filename);
    if (hit && Date.now() < hit.expiresAt) {
      return { exists: hit.exists, content: hit.content };
    }
  }

  const record = await readFromDatabase(filename);

  fileCache.set(filename, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    exists: record.exists,
    content: record.content,
  });

  return record;
};

export const listSharedStateFilenames = async (): Promise<string[]> => {
  if (!isSharedStateConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (testStore) {
    return [...testStore.keys()].sort();
  }

  await ensureSchema();
  const rows = await query<{ filename: string }>(
    'SELECT filename FROM shared_state_files ORDER BY filename'
  );

  return rows.map((row) => row.filename);
};

export const patchSharedStateFile = async (
  filename: string,
  content: string
): Promise<void> => {
  if (!getDatabaseUrl()) {
    if (!testStore) {
      throw new Error('DATABASE_URL is not configured.');
    }
  }

  if (testStore) {
    testStore.set(filename, content);
    testPatchBodies?.push(content);
    fileCache.delete(filename);
    return;
  }

  await ensureSchema();
  await query(
    `INSERT INTO shared_state_files (filename, content, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (filename)
     DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
    [filename, content]
  );

  fileCache.delete(filename);
};
