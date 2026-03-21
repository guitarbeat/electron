import assert from 'node:assert/strict';
import test from 'node:test';

import handler from '../../api/omdb.ts';

const ENV_KEYS = ['OMDB_API_KEY', 'OMDB_API_URL', 'VITE_OMDB_API_KEY', 'VITE_OMDB_API_URL'] as const;
const originalFetch = globalThis.fetch;
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]])
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

const resetEnv = () => {
  ENV_KEYS.forEach((key) => {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  });
};

test.after(() => {
  globalThis.fetch = originalFetch;
  resetEnv();
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  resetEnv();
});

test('OMDb proxy caches identical successful lookups for one hour', async () => {
  let callCount = 0;
  globalThis.fetch = async (input) => {
    callCount += 1;
    assert.equal(
      String(input),
      'https://www.omdbapi.com/?t=Heat'
    );

    return new Response('{"Response":"True","Title":"Heat"}', {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  };

  const firstResponse = await handler(new Request('https://example.com/api/omdb?t=Heat'));
  const secondResponse = await handler(new Request('https://example.com/api/omdb?t=Heat'));

  assert.equal(callCount, 1);
  assert.equal(firstResponse.headers.get('X-Cache'), 'MISS');
  assert.equal(secondResponse.headers.get('X-Cache'), 'HIT');
  assert.equal(await secondResponse.text(), '{"Response":"True","Title":"Heat"}');
});

test('OMDb proxy rejects requests without any lookup parameters', async () => {
  const response = await handler(new Request('https://example.com/api/omdb'));

  assert.equal(response.status, 400);
  assert.match(await response.text(), /lookup parameter/i);
});
