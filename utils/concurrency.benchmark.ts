import { describe, it } from 'node:test';
import assert from 'node:assert';
import { concurrentMap } from './concurrency.ts';

describe('concurrentMap Benchmark', () => {
  it('measures execution time with different concurrency levels', async () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const delay = 50; // 50ms per item

    const worker = async (item: number) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return item * 2;
    };

    // Test concurrency 5
    const start5 = performance.now();
    await concurrentMap(items, 5, worker);
    const end5 = performance.now();
    const duration5 = end5 - start5;
    console.log(`Concurrency 5: ${duration5.toFixed(2)}ms`);

    // Test concurrency 20
    const start20 = performance.now();
    await concurrentMap(items, 20, worker);
    const end20 = performance.now();
    const duration20 = end20 - start20;
    console.log(`Concurrency 20: ${duration20.toFixed(2)}ms`);

    // Theoretical minimum for 5: 50 items / 5 concurrent * 50ms = 500ms
    // Theoretical minimum for 20: 50 items / 20 concurrent = 2.5 rounds -> 3 rounds * 50ms = 150ms
  });
});
