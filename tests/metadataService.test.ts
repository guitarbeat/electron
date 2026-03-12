import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchWithRetry, shouldRetryResponseStatus } from '../src/services/metadataService.ts';

const installMockFetch = (
  implementation: (input: string) => Promise<Response>
): (() => void) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = implementation as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
};

test('shouldRetryResponseStatus only retries transient statuses', () => {
  assert.equal(shouldRetryResponseStatus(404), false);
  assert.equal(shouldRetryResponseStatus(401), false);
  assert.equal(shouldRetryResponseStatus(408), true);
  assert.equal(shouldRetryResponseStatus(429), true);
  assert.equal(shouldRetryResponseStatus(503), true);
});

test('fetchWithRetry does not retry permanent 404 responses', async () => {
  let calls = 0;
  const restoreFetch = installMockFetch(async () => {
    calls += 1;
    return new Response('not found', { status: 404 });
  });

  try {
    const response = await fetchWithRetry('https://example.test/404', 3, 0);
    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  } finally {
    restoreFetch();
  }
});

test('fetchWithRetry retries transient responses until success', async () => {
  let calls = 0;
  const statuses = [503, 502, 200];
  const restoreFetch = installMockFetch(async () => {
    const status = statuses[calls] ?? 200;
    calls += 1;
    return new Response('ok', { status });
  });

  try {
    const response = await fetchWithRetry('https://example.test/retry', 3, 0);
    assert.equal(response.status, 200);
    assert.equal(calls, 3);
  } finally {
    restoreFetch();
  }
});

test('fetchWithRetry retries network failures until success', async () => {
  let calls = 0;
  const restoreFetch = installMockFetch(async () => {
    calls += 1;
    if (calls < 3) {
      throw new Error('network down');
    }
    return new Response('ok', { status: 200 });
  });

  try {
    const response = await fetchWithRetry('https://example.test/network', 3, 0);
    assert.equal(response.status, 200);
    assert.equal(calls, 3);
  } finally {
    restoreFetch();
  }
});
