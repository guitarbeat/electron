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
  process.env.OMDB_API_KEY = 'test-omdb-key';
  let callCount = 0;
  globalThis.fetch = async (input) => {
    callCount += 1;
    const url = new URL(String(input));
    assert.equal(url.origin, 'https://www.omdbapi.com');
    assert.equal(url.searchParams.get('t'), 'Heat');
    assert.equal(url.searchParams.get('apikey'), 'test-omdb-key');

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
  process.env.OMDB_API_KEY = 'test-omdb-key';
  const response = await handler(new Request('https://example.com/api/omdb'));

  assert.equal(response.status, 400);
  assert.match(await response.text(), /lookup parameter/i);
});

test('OMDb proxy forwards search-style autocomplete queries', async () => {
  process.env.OMDB_API_KEY = 'test-omdb-key';
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.origin, 'https://www.omdbapi.com');
    assert.equal(url.searchParams.get('s'), 'Heat');
    assert.equal(url.searchParams.get('type'), 'movie');
    assert.equal(url.searchParams.get('apikey'), 'test-omdb-key');

    return new Response(
      '{"Response":"True","Search":[{"Title":"Heat","Year":"1995","imdbID":"tt0113277","Type":"movie","Poster":"N/A"}]}',
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  };

  const response = await handler(new Request('https://example.com/api/omdb?s=Heat&type=movie'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Cache'), 'MISS');
  assert.match(await response.text(), /"Search":\[/);
});

test('OMDb proxy reports missing OMDB_API_KEY as a config failure', async () => {
  delete process.env.OMDB_API_KEY;
  delete process.env.VITE_OMDB_API_KEY;

  const response = await handler(new Request('https://example.com/api/omdb?t=Heat'));
  const body = JSON.parse(await response.text()) as { error: string; code: string };

  assert.equal(response.status, 500);
  assert.equal(body.code, 'omdb_config');
  assert.match(body.error, /OMDB_API_KEY|VITE_OMDB_API_KEY/i);
});

test('OMDb proxy falls back to VITE_OMDB_API_KEY when the server key is missing', async () => {
  delete process.env.OMDB_API_KEY;
  process.env.VITE_OMDB_API_KEY = 'client-omdb-key';
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.origin, 'https://www.omdbapi.com');
    assert.equal(url.searchParams.get('t'), 'Heat');
    assert.equal(url.searchParams.get('apikey'), 'client-omdb-key');

    return new Response('{"Response":"True","Title":"Heat"}', {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  };

  const response = await handler(new Request('https://example.com/api/omdb?t=Heat'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Cache'), 'MISS');
  assert.match(await response.text(), /"Title":"Heat"/);
});

test('OMDb proxy translates upstream credential failures into a stable auth error', async () => {
  process.env.OMDB_API_KEY = 'bad-key';
  globalThis.fetch = async () =>
    new Response('{"Response":"False","Error":"Invalid API key!"}', {
      status: 401,
      headers: {
        'content-type': 'application/json',
      },
    });

  const response = await handler(new Request('https://example.com/api/omdb?t=Heat'));
  const body = JSON.parse(await response.text()) as { error: string; code: string };

  assert.equal(response.status, 502);
  assert.equal(body.code, 'omdb_auth');
  assert.match(body.error, /configured API key/i);
});

test('OMDb proxy replaces empty apikey query values with configured credentials', async () => {
  process.env.OMDB_API_KEY = 'server-omdb-key';
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.origin, 'https://www.omdbapi.com');
    assert.equal(url.searchParams.get('t'), 'Heat');
    assert.equal(url.searchParams.get('apikey'), 'server-omdb-key');

    return new Response('{"Response":"True","Title":"Heat"}', {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  };

  const response = await handler(new Request('https://example.com/api/omdb?t=Heat&apikey='));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Cache'), 'MISS');
  assert.match(await response.text(), /"Title":"Heat"/);
});
