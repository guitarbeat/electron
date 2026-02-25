import { describe, it } from 'node:test';
import assert from 'node:assert';
import { concurrentMap } from './concurrency';

describe('concurrentMap', () => {
  it('should process all items correctly', async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await concurrentMap(items, 2, async (x) => x * 2);
    assert.deepStrictEqual(results, [2, 4, 6, 8, 10]);
  });

  it('should respect concurrency limit', async () => {
    const items = [1, 2, 3, 4, 5];
    let active = 0;
    let maxActive = 0;

    await concurrentMap(items, 2, async (x) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      active--;
      return x;
    });

    assert.ok(maxActive <= 2, `Expected max concurrency <= 2, got ${maxActive}`);
  });

  it('should maintain order of results', async () => {
    const items = [100, 50, 10]; // Delays
    const results = await concurrentMap(items, 3, async (delay) => {
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
      return delay;
    });
    assert.deepStrictEqual(results, [100, 50, 10]);
  });
});
