/* eslint-disable no-await-in-loop */
import { verifyPin } from '../services/pinService';

// Mock fetch to simulate network latency
let fetchCount = 0;

global.fetch = async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
  fetchCount++;
  // Simulate network latency (e.g., 100ms)
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return a mock response
  return {
    ok: true,
    json: async () => ({
      files: {
        'pins.json': {
          content: JSON.stringify({
            Aaron: 'mocked_hash',
            Electra: 'mocked_hash',
          }),
        },
      },
    }),
  } as Response;
};

async function runBenchmark() {
  console.log('Running PIN verification benchmark...');
  const iterations = 10;
  fetchCount = 0;

  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    // We don't care about the result, just the performance
    await verifyPin('Aaron', '1234');
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;

  console.log(`\nBenchmark Results (${iterations} iterations):`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average Time: ${(totalTime / iterations).toFixed(2)}ms`);
  console.log(`Fetch Count: ${fetchCount}`);
}

runBenchmark().catch(console.error);
