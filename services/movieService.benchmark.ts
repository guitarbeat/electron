/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-promise-executor-return, no-console, no-await-in-loop */
import { test } from 'node:test';
import assert from 'node:assert';

// Mock constants
const GIST_API_URL = 'https://api.github.com/gists/mock-id';

// Mock global fetch
const originalFetch = global.fetch;

// Mock data
const mockMovies = Array(1000)
  .fill(0)
  .map((_, i) => ({
    id: `movie-${i}`,
    title: `Movie ${i}`,
    watched: false,
    addedBy: 'user1',
    createdAt: Date.now(),
  }));

const mockGistResponse = {
  files: {
    'movielist.json': {
      content: JSON.stringify(mockMovies),
    },
  },
};

let fetchCallCount = 0;

// Helper to reset stats
function resetStats() {
  fetchCallCount = 0;
}

// Baseline fetch (always returns full data)
async function baselineGetMovies() {
  const response = await fetch(GIST_API_URL, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (!response.ok) throw new Error('Failed');
  const json = await response.json();
  return JSON.parse(json.files['movielist.json'].content);
}

// Optimized fetch (uses ETag)
let lastETag: string | null = null;
let cachedMovies: any[] = [];

async function optimizedGetMovies() {
  const headers: any = { Accept: 'application/vnd.github.v3+json' };
  if (lastETag) headers['If-None-Match'] = lastETag;

  const response = await fetch(GIST_API_URL, { headers });

  if (response.status === 304) {
    return cachedMovies;
  }

  if (response.ok) {
    const etag = response.headers.get('ETag');
    if (etag) lastETag = etag;
    const json = await response.json();
    cachedMovies = JSON.parse(json.files['movielist.json'].content);
    return cachedMovies;
  }
  throw new Error('Failed');
}

test('Performance Benchmark: Polling Optimization', async (t) => {
  // Setup Mock
  global.fetch = async (url, options) => {
    fetchCallCount++;
    const headers = options?.headers as any;

    // Simulate network latency
    // 304 is usually faster than 200 due to smaller payload
    const networkLatency = headers && headers['If-None-Match'] === '"v1"' ? 50 : 200;

    await new Promise((resolve) => setTimeout(resolve, networkLatency));

    if (headers && headers['If-None-Match'] === '"v1"') {
      return {
        ok: true,
        status: 304,
        headers: new Headers({ ETag: '"v1"' }),
        json: async () => {
          throw new Error('Should not call json on 304');
        },
      } as any;
    }

    return {
      ok: true,
      status: 200,
      headers: new Headers({ ETag: '"v1"' }),
      json: async () => {
        // Simulate JSON parsing overhead of large response + stringify
        await new Promise((resolve) => setTimeout(resolve, 50));
        return mockGistResponse;
      },
    } as any;
  };

  // Measure Baseline
  const baselineStart = performance.now();
  for (let i = 0; i < 10; i++) {
    await baselineGetMovies();
  }
  const baselineEnd = performance.now();
  const baselineDuration = baselineEnd - baselineStart;

  // Measure Optimized
  resetStats();
  const optimizedStart = performance.now();
  for (let i = 0; i < 10; i++) {
    await optimizedGetMovies();
  }
  const optimizedEnd = performance.now();
  const optimizedDuration = optimizedEnd - optimizedStart;

  console.log(`Baseline (10 polls): ${baselineDuration.toFixed(2)}ms`);
  console.log(`Optimized (10 polls): ${optimizedDuration.toFixed(2)}ms`);
  console.log(
    `Improvement: ${(((baselineDuration - optimizedDuration) / baselineDuration) * 100).toFixed(2)}%`
  );

  // Assertions
  assert.ok(optimizedDuration < baselineDuration, 'Optimized version should be faster');

  // Cleanup
  global.fetch = originalFetch;
});
