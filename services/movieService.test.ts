import { test, mock } from 'node:test';
import assert from 'node:assert';
import { getMovies } from './movieService.ts';

// Mock Data
const mockMovies = [
  { id: '1', title: 'Test Movie', watched: false, addedBy: 'user1', createdAt: 100 },
];

const mockGistResponse = {
  files: {
    'movielist.json': {
      content: JSON.stringify(mockMovies),
    },
  },
};

test('getMovies polling optimization', async (t) => {
  let fetchCallCount = 0;

  // Mock fetch
  const originalFetch = global.fetch;
  global.fetch = mock.fn(async (url, options) => {
    fetchCallCount++;
    const headers = options?.headers as any;

    // Check for ETag in request
    if (headers && headers['If-None-Match'] === '"v1"') {
      return {
        ok: false, // 304 is technically not "ok" (200-299)
        status: 304,
        headers: new Headers({ ETag: '"v1"' }), // Server confirms ETag match
        json: async () => {
          throw new Error('Should not call json on 304');
        },
      } as any;
    }

    return {
      ok: true,
      status: 200,
      headers: new Headers({ ETag: '"v1"' }),
      json: async () => mockGistResponse,
    } as any;
  });

  t.after(() => {
    global.fetch = originalFetch;
  });

  // First Call: Expect full fetch
  const movies1 = await getMovies();
  assert.deepStrictEqual(movies1, mockMovies);
  assert.strictEqual(fetchCallCount, 1);

  // Verify fetch called without If-None-Match
  const call1Args = (global.fetch as any).mock.calls[0].arguments;
  assert.strictEqual(call1Args[1].headers['If-None-Match'], undefined);

  // Second Call: Expect optimized fetch
  // This call will fail if the optimization is not implemented
  const movies2 = await getMovies();

  assert.strictEqual(fetchCallCount, 2);
  const call2Args = (global.fetch as any).mock.calls[1].arguments;

  // This assertion is expected to FAIL before optimization
  assert.strictEqual(
    call2Args[1].headers['If-None-Match'],
    '"v1"',
    'Should send If-None-Match header'
  );

  // Also assert movies are still returned correctly (from cache)
  assert.deepStrictEqual(movies2, mockMovies);
});
