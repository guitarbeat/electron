import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

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
let sqlClient: NeonQueryFunction<false, false> | null = null;
let sqlClientUrl = '';
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
      process.env.POSTGRES_PRISMA_URL ||
      process.env.VITE_DATABASE_URL
  );

const getSqlClient = (): NeonQueryFunction<false, false> => {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!sqlClient || sqlClientUrl !== databaseUrl) {
    sqlClient = neon(databaseUrl);
    sqlClientUrl = databaseUrl;
    schemaReady = null;
  }
  return sqlClient;
};

const ensureSchema = async (): Promise<void> => {
  schemaReady ??= getSqlClient()`
    CREATE TABLE IF NOT EXISTS shared_state_files (
      filename text PRIMARY KEY,
      content text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `.then(() => undefined);
  await schemaReady;
};

/** Returns true when the server has Neon/Postgres credentials for read/write. */
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
  const rows = (await getSqlClient()`
    SELECT content
    FROM shared_state_files
    WHERE filename = ${filename}
    LIMIT 1
  `) as Array<{ content: string }>;

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
  const rows = (await getSqlClient()`
    SELECT filename
    FROM shared_state_files
    ORDER BY filename
  `) as Array<{ filename: string }>;

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
  await getSqlClient()`
    INSERT INTO shared_state_files (filename, content, updated_at)
    VALUES (${filename}, ${content}, now())
    ON CONFLICT (filename)
    DO UPDATE SET content = EXCLUDED.content, updated_at = now()
  `;

  fileCache.delete(filename);
};
