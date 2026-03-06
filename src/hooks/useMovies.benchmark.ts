import { describe, it } from 'node:test';
import assert from 'node:assert';
import { concurrentMap } from '@/utils/concurrency';

describe('concurrentMap Benchmark', () => {
  it('measures execution time with different concurrency levels', async () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const delay = 50; // 50ms per item

    const worker = async (item: number) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return item * 2;
    };

    // Test concurrency 5 (old baseline)
    const start5 = performance.now();
    await concurrentMap(items, 5, worker);
    const end5 = performance.now();
    const duration5 = end5 - start5;
    console.log(`Concurrency 5: ${duration5.toFixed(2)}ms`);

    // Test concurrency 20 (new target)
    const start20 = performance.now();
    await concurrentMap(items, 20, worker);
    const end20 = performance.now();
    const duration20 = end20 - start20;
    console.log(`Concurrency 20: ${duration20.toFixed(2)}ms`);

    // Ensure it's faster
    assert.ok(duration20 < duration5, 'Concurrency 20 should be faster than 5');
  });

  it('verifies results order', async () => {
    const items = [1, 2, 3, 4, 5];
    const worker = async (item: number) => item * 2;
    const results = await concurrentMap(items, 2, worker);
    assert.deepStrictEqual(results, [2, 4, 6, 8, 10]);
  });
});
