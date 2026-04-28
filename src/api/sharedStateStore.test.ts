import assert from 'node:assert/strict';
import test from 'node:test';

import {
  invalidateSharedStateCache,
  readSharedStateFile,
  readSharedStateFileRecord,
} from '../../api/_lib/sharedStateStore.ts';
import {
  TEST_UPSTASH_TOKEN,
  TEST_UPSTASH_URL,
  createUpstashMemoryMock,
} from './test/upstashMock.ts';

const withUpstashEnv = async (
  env: {
    UPSTASH_REDIS_REST_URL?: string;
    VITE_UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    VITE_UPSTASH_REDIS_REST_TOKEN?: string;
  },
  run: (calls: string[]) => Promise<void>
) => {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousViteUrl = process.env.VITE_UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const previousViteToken = process.env.VITE_UPSTASH_REDIS_REST_TOKEN;
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  if (typeof env.UPSTASH_REDIS_REST_URL === 'string') {
    process.env.UPSTASH_REDIS_REST_URL = env.UPSTASH_REDIS_REST_URL;
  } else {
    delete process.env.UPSTASH_REDIS_REST_URL;
  }

  if (typeof env.VITE_UPSTASH_REDIS_REST_URL === 'string') {
    process.env.VITE_UPSTASH_REDIS_REST_URL = env.VITE_UPSTASH_REDIS_REST_URL;
  } else {
    delete process.env.VITE_UPSTASH_REDIS_REST_URL;
  }

  if (typeof env.UPSTASH_REDIS_REST_TOKEN === 'string') {
    process.env.UPSTASH_REDIS_REST_TOKEN = env.UPSTASH_REDIS_REST_TOKEN;
  } else {
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }

  if (typeof env.VITE_UPSTASH_REDIS_REST_TOKEN === 'string') {
    process.env.VITE_UPSTASH_REDIS_REST_TOKEN = env.VITE_UPSTASH_REDIS_REST_TOKEN;
  } else {
    delete process.env.VITE_UPSTASH_REDIS_REST_TOKEN;
  }

  invalidateSharedStateCache();

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    calls.push(request.url);
    return new Response(JSON.stringify({ result: '{"ok":true}' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    await run(calls);
  } finally {
    globalThis.fetch = originalFetch;

    if (typeof previousUrl === 'string') {
      process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    } else {
      delete process.env.UPSTASH_REDIS_REST_URL;
    }

    if (typeof previousViteUrl === 'string') {
      process.env.VITE_UPSTASH_REDIS_REST_URL = previousViteUrl;
    } else {
      delete process.env.VITE_UPSTASH_REDIS_REST_URL;
    }

    if (typeof previousToken === 'string') {
      process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
    } else {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    }

    if (typeof previousViteToken === 'string') {
      process.env.VITE_UPSTASH_REDIS_REST_TOKEN = previousViteToken;
    } else {
      delete process.env.VITE_UPSTASH_REDIS_REST_TOKEN;
    }

    invalidateSharedStateCache();
  }
};

test('readSharedStateFile strips nested quotes from REST URL before calling Upstash', async () => {
  await withUpstashEnv(
    {
      UPSTASH_REDIS_REST_URL: `""${TEST_UPSTASH_URL}""`,
      UPSTASH_REDIS_REST_TOKEN: TEST_UPSTASH_TOKEN,
    },
    async (calls) => {
      const content = await readSharedStateFile('movielist.json');
      assert.equal(content, '{"ok":true}');
      assert.ok(calls[0]?.startsWith(`${TEST_UPSTASH_URL}/get/`));
    }
  );
});

test('readSharedStateFile falls back to VITE_ env vars and trims trailing slash on base URL', async () => {
  await withUpstashEnv(
    {
      VITE_UPSTASH_REDIS_REST_URL: `${TEST_UPSTASH_URL}/`,
      VITE_UPSTASH_REDIS_REST_TOKEN: TEST_UPSTASH_TOKEN,
    },
    async (calls) => {
      const content = await readSharedStateFile('movielist.json');
      assert.equal(content, '{"ok":true}');
      assert.ok(calls[0]?.startsWith(`${TEST_UPSTASH_URL}/get/`));
    }
  );
});

test('readSharedStateFileRecord distinguishes missing keys from present empty strings', async () => {
  const mock = createUpstashMemoryMock({
    'empty.json': '',
  });

  try {
    const presentEmpty = await readSharedStateFileRecord('empty.json');
    const missing = await readSharedStateFileRecord('missing.json');

    assert.deepEqual(presentEmpty, { exists: true, content: '' });
    assert.deepEqual(missing, { exists: false, content: null });
  } finally {
    mock.dispose();
  }
});
