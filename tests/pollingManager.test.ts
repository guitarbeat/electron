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

test('should handle fetch errors and notify listeners', async () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const error = new Error('Fetch failed');
    const fetchFn = async () => {
      throw error;
    };
    const key = 'test-error';

    let receivedData: any;
    let receivedError: any;

    const unsub = pollingManager.subscribe(key, fetchFn, 1000, (d, e) => {
      receivedData = d;
      receivedError = e;
    });

    await wait(20);

    assert.equal(receivedData, undefined);
    assert.equal(receivedError, error);
    assert.equal(pollingManager.getError(key), error);

    unsub();
  } finally {
    console.error = originalConsoleError;
  }
});
