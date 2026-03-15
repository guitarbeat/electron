import test from 'node:test';
import assert from 'node:assert/strict';
import { pollingManager } from '../src/services/PollingManager.ts';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('pollingManager deduplicates in-flight refresh calls', async () => {
  const key = `pm-dedupe-${Date.now()}`;
  let calls = 0;

  const fetchFn = async () => {
    calls += 1;
    await wait(25);
    return [{ id: calls }];
  };

  const unsubscribe = pollingManager.subscribe(key, fetchFn, 10_000, () => {});
  await wait(5);

  await Promise.all([pollingManager.refresh(key), pollingManager.refresh(key)]);
  assert.equal(calls, 1);

  unsubscribe();
});

test('pollingManager clears cache after last unsubscribe', async () => {
  const key = `pm-cache-${Date.now()}`;
  let value = 1;
  const seen: number[] = [];

  const unsubscribeA = pollingManager.subscribe(
    key,
    async () => [{ id: value }],
    10_000,
    (data) => {
      const first = data?.[0]?.id;
      if (typeof first === 'number') seen.push(first);
    }
  );

  await wait(20);
  unsubscribeA();

  value = 2;

  const unsubscribeB = pollingManager.subscribe(
    key,
    async () => [{ id: value }],
    10_000,
    (data) => {
      const first = data?.[0]?.id;
      if (typeof first === 'number') seen.push(first);
    }
  );

  await wait(20);
  unsubscribeB();

  assert.ok(seen.includes(1));
  assert.ok(seen.includes(2));
  assert.equal(pollingManager.getData(key), undefined);
});

test('pollingManager notifies listeners when fetch fails', async () => {
  const key = `pm-error-${Date.now()}`;
  const expectedError = new Error('Fetch failed');
  let receivedData: Array<{ id: number }> | undefined;
  let receivedError: unknown;
  const originalConsoleError = console.error;
  const errorCalls: unknown[][] = [];

  console.error = (...args: unknown[]) => {
    errorCalls.push(args);
  };

  try {
    const unsubscribe = pollingManager.subscribe(
      key,
      async () => {
        throw expectedError;
      },
      10_000,
      (data, error) => {
        receivedData = data;
        receivedError = error;
      }
    );

    await wait(20);

    assert.equal(receivedData, undefined);
    assert.equal(receivedError, expectedError);
    assert.equal(pollingManager.getError(key), expectedError);
    assert.equal(errorCalls.length, 1);
    assert.ok(String(errorCalls[0]?.[0] ?? '').includes(key));

    unsubscribe();
  } finally {
    console.error = originalConsoleError;
  }
});

test('pollingManager isolates listener errors', async () => {
  const key = `pm-listener-${Date.now()}`;

  let resolveFetch: ((value: Array<{ id: number }>) => void) | null = null;
  const fetchFn = () =>
    new Promise<Array<{ id: number }>>((resolve) => {
      resolveFetch = resolve;
    });

  let okCalls = 0;
  const errorCalls: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    errorCalls.push(args);
  };

  try {
    const unsubscribeThrow = pollingManager.subscribe(key, fetchFn, 10_000, () => {
      throw new Error('boom');
    });

    const unsubscribeOk = pollingManager.subscribe(key, fetchFn, 10_000, (data, error) => {
      if (error) return;
      if (data) okCalls += 1;
    });

    await wait(0);
    assert.ok(resolveFetch);
    resolveFetch([{ id: 1 }]);
    await wait(0);

    assert.equal(okCalls, 1);
    assert.equal(pollingManager.getError(key), undefined);
    assert.equal(errorCalls.length, 1);
    assert.ok(String(errorCalls[0]?.[0] ?? '').includes(key));

    unsubscribeThrow();
    unsubscribeOk();
  } finally {
    console.error = originalConsoleError;
  }
});

test('pollingManager accepts null payloads when allowNull is enabled', async () => {
  const key = `pm-null-${Date.now()}`;
  let receivedData: { id: number }[] | null | undefined;
  let receivedError: unknown;

  const unsubscribe = pollingManager.subscribe(
    key,
    async () => null,
    10_000,
    (data, error) => {
      receivedData = data;
      receivedError = error;
    },
    { allowNull: true }
  );

  await wait(20);

  assert.equal(receivedData, null);
  assert.equal(receivedError, null);
  assert.equal(pollingManager.getData(key), null);
  assert.equal(pollingManager.getError(key), undefined);

  unsubscribe();
});
