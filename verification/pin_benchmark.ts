import { test } from 'node:test';
import assert from 'node:assert';

// Mock fetch to simulate network latency
let fetchCount = 0;

global.fetch = async (): Promise<Response> => {
  fetchCount++;
  // Simulate network delay
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
  return new Response(JSON.stringify({}), { status: 200 });
};

test('Pin Benchmark', async () => {
  await fetch('https://api.github.com/gists/test');
  assert.strictEqual(fetchCount, 1);
});
