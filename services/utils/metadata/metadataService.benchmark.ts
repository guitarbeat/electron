import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { searchMovies } from './metadataService.ts';

test('searchMovies performance benchmark', async (t) => {
  const DELAY = 100;

  // Mock fetch to simulate network latency
  const mockFetch = mock.method(global, 'fetch', async (url: string | URL) => {
    await new Promise((resolve) => setTimeout(resolve, DELAY));

    const urlString = url.toString();

    // OMDb Mock
    if (urlString.includes('omdbapi.com')) {
      return {
        ok: true,
        json: async () => ({
          Response: 'True',
          Search: [
            { Title: 'OMDb Movie', Year: '2023', imdbID: 'tt123', Type: 'movie', Poster: 'N/A' },
          ],
        }),
      } as Response;
    }

    // TVMaze Mock
    if (urlString.includes('tvmaze.com')) {
      return {
        ok: true,
        json: async () => [
          {
            show: {
              id: 456,
              name: 'TVMaze Show',
              premiered: '2023-01-01',
              image: null,
              summary: 'Summary',
              genres: ['Drama'],
            },
          },
        ],
      } as Response;
    }

    return { ok: false, status: 404 } as Response;
  });

  const start = performance.now();
  const results = await searchMovies('test');
  const duration = performance.now() - start;

  mockFetch.mock.restore();

  console.log(`Execution time: ${duration.toFixed(2)}ms`);

  // Baseline (sequential) should be > 2 * DELAY (200ms)
  // Optimized (parallel) should be ~ DELAY (100ms) + overhead
});
