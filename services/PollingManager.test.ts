import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pollingManager } from './PollingManager.ts';

describe('PollingManager', () => {
  it('should deduplicate fetches for same key', async () => {
    let fetchCount = 0;
    const fetchFn = async () => {
      fetchCount++;
      return { count: fetchCount };
    };

    const interval = 100;
    const key = 'test-dedupe';

    const unsubscribe1 = pollingManager.subscribe(key, fetchFn, interval, () => {});
    const unsubscribe2 = pollingManager.subscribe(key, fetchFn, interval, () => {});

    // Initial fetch
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(fetchCount, 1, 'Should fetch immediately once');

    // Wait for at least one interval tick.
    await new Promise((r) => setTimeout(r, interval + 20));
    assert.ok(fetchCount >= 2, 'Should continue polling on interval');

    const countAtUnsubscribe = fetchCount;

    unsubscribe1();
    unsubscribe2();

    // Wait another interval and ensure polling has stopped.
    await new Promise((r) => setTimeout(r, interval + 20));
    assert.strictEqual(fetchCount, countAtUnsubscribe, 'Should stop polling after unsubscribe');
  });

  it('should broadcast data to all listeners', async () => {
    const data = { id: 1 };
    const fetchFn = async () => data;
    const key = 'test-broadcast';

    let received1: { id: number } | undefined;
    let received2: { id: number } | undefined;

    const unsub1 = pollingManager.subscribe(key, fetchFn, 1000, (d) => {
      received1 = d;
    });
    const unsub2 = pollingManager.subscribe(key, fetchFn, 1000, (d) => {
      received2 = d;
    });

    await new Promise((r) => setTimeout(r, 20));

    assert.deepStrictEqual(received1, data);
    assert.deepStrictEqual(received2, data);

    unsub1();
    unsub2();
  });

  it('should return cached data immediately to new subscribers', async () => {
    const data = { id: 2 };
    const fetchFn = async () => data;
    const key = 'test-cache';

    const unsub1 = pollingManager.subscribe(key, fetchFn, 1000, () => {});
    await new Promise((r) => setTimeout(r, 20));

    let received: { id: number } | undefined;
    const unsub2 = pollingManager.subscribe(key, fetchFn, 1000, (d) => {
      received = d;
    });

    assert.deepStrictEqual(received, data, 'Should receive cached data synchronously/immediately');

    unsub1();
    unsub2();
  });

  it('should refresh immediately', async () => {
    let count = 0;
    const fetchFn = async () => ++count;
    const key = 'test-refresh';

    const unsub = pollingManager.subscribe(key, fetchFn, 10000, () => {});
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(count, 1);

    await pollingManager.refresh(key);
    assert.strictEqual(count, 2);

    unsub();
  });

  it('should not overlap refreshes while a request is already in flight', async () => {
    let fetchCount = 0;
    let resolveFirstFetch: ((value: number) => void) | undefined;
    const fetchFn = () => {
      fetchCount += 1;
      if (fetchCount === 1) {
        return new Promise<number>((resolve) => {
          resolveFirstFetch = resolve;
        });
      }
      return Promise.resolve(fetchCount);
    };
    const key = 'test-overlap-refresh';

    const unsub = pollingManager.subscribe(key, fetchFn, 10000, () => {});
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(fetchCount, 1);

    const refreshOne = pollingManager.refresh(key);
    const refreshTwo = pollingManager.refresh(key);

    assert.strictEqual(fetchCount, 1, 'Should not issue overlapping requests for the same key');
    assert.strictEqual(refreshOne, refreshTwo, 'Concurrent refresh calls should share one promise');

    assert.ok(resolveFirstFetch, 'Expected first fetch to still be in flight');
    resolveFirstFetch(1);
    await Promise.all([refreshOne, refreshTwo]);

    await pollingManager.refresh(key);
    assert.strictEqual(fetchCount, 2, 'Should allow a new request once in-flight request settles');

    unsub();
  });

  it('should handle fetch errors and notify listeners', async () => {
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

      await new Promise((r) => setTimeout(r, 20));

      assert.strictEqual(receivedData, undefined);
      assert.strictEqual(receivedError, error);
      assert.strictEqual(pollingManager.getError(key), error);

      unsub();
    } finally {
      console.error = originalConsoleError;
    }
  });
});
