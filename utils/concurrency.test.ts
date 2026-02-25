import { describe, it } from 'node:test';
import assert from 'node:assert';
import { concurrentMap } from './concurrency.ts';

describe('concurrentMap', () => {
  it('should process items and return results in order', async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await concurrentMap(items, 2, async (item) => {
      return item * 2;
    });
    assert.deepStrictEqual(results, [2, 4, 6, 8, 10]);
  });

  it('should handle concurrency limits', async () => {
    const items = [1, 2, 3, 4, 5];
    let active = 0;
    let maxActive = 0;

    await concurrentMap(items, 2, async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      active--;
      return true;
    });

    assert.ok(maxActive <= 2, `Expected max active (${maxActive}) to be <= 2`);
  });

  it('should handle empty array', async () => {
    const results = await concurrentMap([], 2, async () => true);
    assert.deepStrictEqual(results, []);
  });

  it('should propagate errors', async () => {
    const items = [1, 2, 3];
    await assert.rejects(
      async () => {
        await concurrentMap(items, 2, async (item) => {
          if (item === 2) throw new Error('Failed');
          return item;
        });
      },
      { message: 'Failed' }
    );
  });
});
