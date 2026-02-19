import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pollingManager } from '../services/PollingManager';

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

    // Wait for interval
    await new Promise((r) => setTimeout(r, interval + 20));
    assert.strictEqual(fetchCount, 2, 'Should fetch again after interval');

    unsubscribe1();
    unsubscribe2();

    // Wait another interval
    await new Promise((r) => setTimeout(r, interval + 20));
    assert.strictEqual(fetchCount, 2, 'Should stop polling after unsubscribe');
  });

  it('should broadcast data to all listeners', async () => {
    const data = { id: 1 };
    const fetchFn = async () => data;
    const key = 'test-broadcast';

    let received1: any;
    let received2: any;

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

    let received: any;
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
});
