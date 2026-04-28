import { invalidateSharedStateCache } from '../../../api/_lib/sharedStateStore.ts';

/** Must match default prefix in `api/_lib/sharedStateStore.ts`. */
export const TEST_STATE_KEY_PREFIX = 'app:state:';

export const TEST_UPSTASH_URL = 'https://mock-redis.example';
export const TEST_UPSTASH_TOKEN = 'test-upstash-token';

const fullKey = (filename: string): string => `${TEST_STATE_KEY_PREFIX}${filename}`;

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export interface UpstashMemoryMockContext {
  /** Filename → JSON string (same shape as prior Gist file contents). */
  getFile: (filename: string) => string | undefined;
  /** Raw string bodies passed to Redis SET (one entry per successful write). */
  patchBodies: string[];
  /** Raw POST / pipeline command arrays (e.g. KEYS). */
  postCommands: unknown[][];
}

/**
 * Installs an in-memory Upstash REST mock and shared-state env vars.
 * Restores `fetch` and env in `finally` via the returned `dispose` function.
 */
export const createUpstashMemoryMock = (
  initialFiles: Record<string, string>
): UpstashMemoryMockContext & { dispose: () => void } => {
  const store = new Map<string, string>();
  for (const [filename, content] of Object.entries(initialFiles)) {
    store.set(fullKey(filename), content);
  }

  const patchBodies: string[] = [];
  const postCommands: unknown[][] = [];
  const originalFetch = globalThis.fetch;
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const previousViteUrl = process.env.VITE_UPSTASH_REDIS_REST_URL;
  const previousViteToken = process.env.VITE_UPSTASH_REDIS_REST_TOKEN;

  process.env.UPSTASH_REDIS_REST_URL = TEST_UPSTASH_URL;
  process.env.UPSTASH_REDIS_REST_TOKEN = TEST_UPSTASH_TOKEN;
  invalidateSharedStateCache();

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);

    if (
      request.method === 'POST' &&
      url.origin === new URL(TEST_UPSTASH_URL).origin &&
      (url.pathname === '/' || url.pathname === '')
    ) {
      const text = await request.text();
      let cmd: unknown[];
      try {
        cmd = JSON.parse(text) as unknown[];
      } catch {
        return jsonResponse({ error: 'ERR invalid JSON' }, 400);
      }
      postCommands.push(cmd);
      const op = String(cmd[0] ?? '').toUpperCase();
      if (op === 'KEYS' && cmd.length >= 2) {
        const pattern = String(cmd[1]);
        const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
        const keys = [...store.keys()].filter((k) => k.startsWith(prefix));
        return jsonResponse({ result: keys });
      }
      return jsonResponse({ error: `ERR unmocked POST command: ${op}` }, 400);
    }

    const segments = url.pathname.split('/').filter(Boolean).map((s) => decodeURIComponent(s));
    const head = segments[0]?.toLowerCase();

    if (head === 'get' && segments.length >= 2) {
      const key = segments.slice(1).join('/');
      if (!store.has(key)) {
        return jsonResponse({ result: null });
      }
      return jsonResponse({ result: store.get(key) ?? null });
    }

    if (head === 'set' && segments.length >= 2 && request.method === 'POST') {
      const key = segments.slice(1).join('/');
      const body = await request.text();
      store.set(key, body);
      patchBodies.push(body);
      return jsonResponse({ result: 'OK' });
    }

    return jsonResponse({ error: 'unmocked Upstash request' }, 404);
  }) as typeof fetch;

  return {
    getFile: (filename: string) => store.get(fullKey(filename)),
    patchBodies,
    postCommands,
    dispose: () => {
      globalThis.fetch = originalFetch;
      invalidateSharedStateCache();

      if (typeof previousUrl === 'string') {
        process.env.UPSTASH_REDIS_REST_URL = previousUrl;
      } else {
        delete process.env.UPSTASH_REDIS_REST_URL;
      }
      if (typeof previousToken === 'string') {
        process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
      } else {
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
      }
      if (typeof previousViteUrl === 'string') {
        process.env.VITE_UPSTASH_REDIS_REST_URL = previousViteUrl;
      } else {
        delete process.env.VITE_UPSTASH_REDIS_REST_URL;
      }
      if (typeof previousViteToken === 'string') {
        process.env.VITE_UPSTASH_REDIS_REST_TOKEN = previousViteToken;
      } else {
        delete process.env.VITE_UPSTASH_REDIS_REST_TOKEN;
      }
    },
  };
};
