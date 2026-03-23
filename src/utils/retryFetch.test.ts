import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchWithRetry } from '../../api/_lib/retryFetch.ts';

const jsonResponse = (body: unknown, status: number, headers?: HeadersInit): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: new Headers(headers),
  });

test('fetchWithRetry returns on first ok', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return jsonResponse({ ok: true }, 200);
  };

  const res = await fetchWithRetry('https://example.com', { method: 'GET' }, 'test');
  assert.equal(res.status, 200);
  assert.equal(calls, 1);
});

test('fetchWithRetry retries on 503 then succeeds', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return jsonResponse({ message: 'unavailable' }, 503);
    }
    return jsonResponse({ ok: true }, 200);
  };

  const res = await fetchWithRetry('https://example.com', { method: 'GET' }, 'test');
  assert.equal(res.status, 200);
  assert.equal(calls, 2);
});

test('fetchWithRetry returns last response after max attempts on 503', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return jsonResponse({ message: 'unavailable' }, 503);
  };

  const res = await fetchWithRetry('https://example.com', { method: 'GET' }, 'test');
  assert.equal(res.status, 503);
  assert.equal(calls, 3);
});

test('fetchWithRetry does not retry 404', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return jsonResponse({ error: 'nf' }, 404);
  };

  const res = await fetchWithRetry('https://example.com', { method: 'GET' }, 'test');
  assert.equal(res.status, 404);
  assert.equal(calls, 1);
});

test('fetchWithRetry times out and retries', async () => {
  let calls = 0;
  let aborts = 0;

  globalThis.fetch = async (_input, init) => {
    calls += 1;
    const signal = init?.signal as AbortSignal | undefined;

    return new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener(
        'abort',
        () => {
          aborts += 1;
          reject(new Error('aborted'));
        },
        { once: true }
      );
    });
  };

  await assert.rejects(() =>
    fetchWithRetry('https://example.com', { method: 'GET' }, 'test', { timeoutMs: 10 }),
  );

  // MAX_ATTEMPTS is 3 in the implementation.
  assert.equal(calls, 3);
  assert.ok(aborts >= 1);
});
