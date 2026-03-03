/* eslint-disable no-console, no-await-in-loop, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-promise-executor-return */
import assert from 'node:assert';
import { test } from 'node:test';

const originalFetch = global.fetch;
let fetchCallCount = 0;

global.fetch = async (_url, _options) => {
  fetchCallCount++;
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    ok: true,
    status: 200,
    json: async () => ({ files: { 'pins.json': { content: '{"Aaron":"hash"}' } } }),
  } as any;
};

test('Performance Benchmark: Pin Service Request Deduplication', async () => {
  const { getPins } = await import('./pinService.ts');
  fetchCallCount = 0;

  const start = performance.now();
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(getPins());
  }

  await Promise.all(promises);

  const end = performance.now();
  console.log(`Concurrent Fetches (10 polls): ${(end - start).toFixed(2)}ms`);
  console.log(`Fetch called: ${fetchCallCount} times`);

  assert.strictEqual(fetchCallCount, 1, 'Should only call fetch once');
  global.fetch = originalFetch;
});
