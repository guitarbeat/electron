import test from 'node:test';
import assert from 'node:assert/strict';
import { concurrentMap, shuffleArray } from '../src/utils/index.ts';

test('shuffleArray returns a shuffled copy without mutating the source', () => {
  const source = [1, 2, 3, 4];
  const randomValues = [0.75, 0.25, 0.5];
  let index = 0;

  const shuffled = shuffleArray(source, () => {
    const value = randomValues[index];
    index += 1;
    return value;
  });

  assert.deepEqual(source, [1, 2, 3, 4]);
  assert.deepEqual(shuffled, [3, 2, 1, 4]);
  assert.notEqual(shuffled, source);
});

test('shuffleArray follows Fisher-Yates ordering for a deterministic rng sequence', () => {
  const source = ['a', 'b', 'c', 'd'];
  const randomValues = [0.2, 0.9, 0.1];
  let index = 0;

  const shuffled = shuffleArray(source, () => {
    const value = randomValues[index];
    index += 1;
    return value;
  });

  assert.deepEqual(shuffled, ['b', 'd', 'c', 'a']);
});

test('concurrentMap preserves input order with parallel work', async () => {
  const items = [1, 2, 3, 4];
  const delays = new Map([
    [1, 30],
    [2, 10],
    [3, 20],
    [4, 5],
  ]);

  const results = await concurrentMap(items, 2, async (item) => {
    await new Promise((resolve) => {
      setTimeout(resolve, delays.get(item) ?? 0);
    });
    return item * 10;
  });

  assert.deepEqual(results, [10, 20, 30, 40]);
});
