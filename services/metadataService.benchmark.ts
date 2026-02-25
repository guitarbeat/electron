import { mock } from 'node:test';
import { fetchMovieMetadata, searchMovies } from './metadataService.ts';

// Mock fetch to simulate network delay
const originalFetch = global.fetch;
global.fetch = mock.fn(async (url: string) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  }); // 100ms delay

  if (url.includes('omdbapi.com')) {
    return {
      ok: true,
      json: async () => ({ Response: 'False', Error: 'Movie not found!' }),
    } as Response;
  }

  if (url.includes('api.tvmaze.com')) {
    return {
      ok: true,
      json: async () => [],
    } as Response;
  }

  return { ok: false } as Response;
});

async function runBenchmark() {
  console.log('Starting benchmark...');

  // Benchmark fetchMovieMetadata (case where it fails both and thus awaits both sequentially)
  const start1 = Date.now();
  await fetchMovieMetadata('Non-existent movie');
  const end1 = Date.now();
  console.log(`fetchMovieMetadata (no match): ${end1 - start1}ms`);

  // Benchmark searchMovies
  const start2 = Date.now();
  await searchMovies('Query');
  const end2 = Date.now();
  console.log(`searchMovies: ${end2 - start2}ms`);
}

runBenchmark()
  .catch(console.error)
  .finally(() => {
    global.fetch = originalFetch;
  });
