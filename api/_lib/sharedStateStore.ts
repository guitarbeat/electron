import { fetchWithRetry } from './retryFetch.ts';

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

const normalizeRestUrl = (value: string | undefined): string => {
  const raw = cleanEnvValue(value);
  if (!raw) {
    return '';
  }
  return raw.replace(/\/+$/, '');
};

const getRestUrl = (): string =>
  normalizeRestUrl(
    process.env.UPSTASH_REDIS_REST_URL ||
      process.env.VITE_UPSTASH_REDIS_REST_URL
  );

const getRestToken = (): string =>
  cleanEnvValue(
    process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.VITE_UPSTASH_REDIS_REST_TOKEN
  );

const getKeyPrefix = (): string => {
  const prefix = cleanEnvValue(process.env.UPSTASH_STATE_KEY_PREFIX);
  return prefix ? (prefix.endsWith(':') ? prefix : `${prefix}:`) : 'app:state:';
};

const redisKey = (filename: string): string => `${getKeyPrefix()}${filename}`;

const getAuthHeaders = (): Headers => {
  const headers = new Headers();
  const token = getRestToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

const buildUrl = (pathSegments: string[]): string => {
  const base = getRestUrl();
  const encoded = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${base}/${encoded}`;
};

interface UpstashJsonResult {
  result?: unknown;
  error?: string;
}

const parseUpstashBody = async (response: Response): Promise<UpstashJsonResult> => {
  try {
    return (await response.json()) as UpstashJsonResult;
  } catch {
    return {};
  }
};

const throwIfUpstashError = (body: UpstashJsonResult, fallback: string): void => {
  if (typeof body.error === 'string' && body.error.length > 0) {
    throw new Error(`${fallback}: ${body.error}`);
  }
};

const postUpstashCommand = async (
  command: (string | number)[],
  context: string
): Promise<UpstashJsonResult> => {
  const base = getRestUrl();
  if (!base) {
    throw new Error('UPSTASH_REDIS_REST_URL is not configured.');
  }

  const response = await fetchWithRetry(
    base,
    {
      method: 'POST',
      headers: new Headers({
        ...Object.fromEntries(getAuthHeaders()),
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(command),
    },
    context
  );

  const body = await parseUpstashBody(response);

  if (!response.ok) {
    throw new Error(`${context} (${response.status}).`);
  }

  throwIfUpstashError(body, context);
  return body;
};

/** Returns true when the server has Upstash credentials for read/write. */
export const isSharedStateConfigured = (): boolean =>
  Boolean(getRestUrl() && getRestToken());

/** Same as {@link isSharedStateConfigured}; writes require the same full token. */
export const isSharedStateWriteConfigured = (): boolean => isSharedStateConfigured();

export const invalidateSharedStateCache = (): void => {
  fileCache.clear();
};

const runGetCommand = async (filename: string): Promise<SharedStateFileRecord> => {
  const url = buildUrl(['get', redisKey(filename)]);
  const response = await fetchWithRetry(
    url,
    { method: 'GET', headers: getAuthHeaders() },
    'read shared state'
  );

  const body = await parseUpstashBody(response);

  if (!response.ok) {
    throw new Error(`Failed to read shared state (${response.status}).`);
  }

  throwIfUpstashError(body, 'Failed to read shared state');

  if (body.result === null || typeof body.result === 'undefined') {
    return { exists: false, content: null };
  }

  if (typeof body.result !== 'string') {
    throw new Error('Failed to read shared state (unexpected value type).');
  }

  return {
    exists: true,
    content: body.result,
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
    throw new Error('UPSTASH_REDIS_REST_URL is not configured.');
  }

  if (!options.bypassCache) {
    const hit = fileCache.get(filename);
    if (hit && Date.now() < hit.expiresAt) {
      return { exists: hit.exists, content: hit.content };
    }
  }

  const record = await runGetCommand(filename);

  fileCache.set(filename, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    exists: record.exists,
    content: record.content,
  });

  return record;
};

export const listSharedStateFilenames = async (): Promise<string[]> => {
  if (!isSharedStateConfigured()) {
    throw new Error('UPSTASH_REDIS_REST_URL is not configured.');
  }

  const prefix = getKeyPrefix();
  const pattern = `${prefix}*`;
  const body = await postUpstashCommand(['KEYS', pattern], 'list shared state');

  const raw = body.result;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((k): k is string => typeof k === 'string' && k.startsWith(prefix))
    .map((k) => k.slice(prefix.length));
};

export const patchSharedStateFile = async (
  filename: string,
  content: string
): Promise<void> => {
  if (!getRestUrl()) {
    throw new Error('UPSTASH_REDIS_REST_URL is not configured.');
  }

  if (!getRestToken()) {
    throw new Error('UPSTASH_REDIS_REST_TOKEN is not configured.');
  }

  const key = redisKey(filename);
  const url = buildUrl(['set', key]);

  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: new Headers({
        ...Object.fromEntries(getAuthHeaders()),
        'Content-Type': 'application/octet-stream',
      }),
      body: content,
    },
    'write shared state'
  );

  const body = await parseUpstashBody(response);

  if (!response.ok) {
    throw new Error(`Failed to update shared state (${response.status}).`);
  }

  throwIfUpstashError(body, 'Failed to update shared state');

  fileCache.delete(filename);
};
