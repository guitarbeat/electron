import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSortedMovies } from './movieSorting.ts';
import type { Movie } from '../types.ts';

// Helper to create mock movies
const createMovie = (
  id: string,
  watchedByLength: number,
  createdAt: string,
  extra: Partial<Movie> = {}
): Movie => ({
  id,
  title: `Movie ${id}`,
  addedBy: 'Aaron',
  // @ts-ignore: Mocking User[] with array of correct length
  watchedBy: new Array(watchedByLength).fill('Aaron'),
  createdAt,
  category: 'Movies',
  ...extra,
});

test('getSortedMovies sorts correctly (unwatched first, then watched; newest first in group)', () => {
  // Scenario:
  // A: unwatched (length 0), created 2023-01-01
  // B: unwatched (length 1), created 2023-01-02
  // C: watched (length 2), created 2023-01-01
  // D: watched (length 2), created 2023-01-02

  // Sort order:
  // Unwatched (A, B) comes before Watched (C, D).
  // Within Unwatched: newest first -> B then A.
  // Within Watched: newest first -> D then C.
  // Expected: B, A, D, C

  const movies: Movie[] = [
    createMovie('A', 0, '2023-01-01'),
    createMovie('B', 1, '2023-01-02'),
    createMovie('C', 2, '2023-01-01'),
    createMovie('D', 2, '2023-01-02'),
  ];

  const { sortedMovies } = getSortedMovies(movies);
  const ids = sortedMovies.map((m) => m.id);

  assert.deepEqual(ids, ['B', 'A', 'D', 'C']);
});

test('getSortedMovies reuses previous sort order when possible', () => {
  const movies1: Movie[] = [
    createMovie('A', 0, '2023-01-01'),
    createMovie('B', 1, '2023-01-02'),
  ];
  // Expected: B, A
  const state1 = getSortedMovies(movies1);
  assert.deepEqual(state1.sortedMovies.map(m => m.id), ['B', 'A']);

  // Update movies with metadata change only (irrelevant to sort)
  const movies2: Movie[] = [
    createMovie('A', 0, '2023-01-01', { plot: 'Updated plot' }),
    createMovie('B', 1, '2023-01-02', { posterUrl: 'http://example.com/poster.jpg' }),
  ];

  const state2 = getSortedMovies(movies2, state1);

  assert.deepEqual(state2.sortedMovies.map(m => m.id), ['B', 'A']);
  // Ensure we got the NEW movie objects
  assert.equal(state2.sortedMovies[0].posterUrl, 'http://example.com/poster.jpg');
  assert.equal(state2.sortedMovies[1].plot, 'Updated plot');

  // Ensure indices were reused (optimization check)
  // We can check if sortedIndices reference is same?
  // The implementation reuses indices array reference? No, it returns `sortedIndices` from `lastState`.
  assert.strictEqual(state2.sortedIndices, state1.sortedIndices);
});

test('getSortedMovies re-sorts when sort criteria changes', () => {
  const movies1: Movie[] = [
    createMovie('A', 0, '2023-01-01'),
    createMovie('B', 1, '2023-01-02'),
  ];
  // Expected: B, A
  const state1 = getSortedMovies(movies1);

  // Change B to be watched (length 2)
  // Now A (unwatched) should come before B (watched)
  const movies2: Movie[] = [
    createMovie('A', 0, '2023-01-01'),
    createMovie('B', 2, '2023-01-02'),
  ];

  const state2 = getSortedMovies(movies2, state1);

  assert.deepEqual(state2.sortedMovies.map(m => m.id), ['A', 'B']);
  assert.notStrictEqual(state2.sortedIndices, state1.sortedIndices);
});

test('getSortedMovies re-sorts when createdAt changes', () => {
  const movies1: Movie[] = [
    createMovie('A', 0, '2023-01-01'),
    createMovie('B', 0, '2023-01-02'),
  ];
  // Expected: B (newest), A (oldest)
  const state1 = getSortedMovies(movies1);
  assert.deepEqual(state1.sortedMovies.map(m => m.id), ['B', 'A']);

  // Change A's date to be newer than B
  const movies2: Movie[] = [
    createMovie('A', 0, '2023-01-03'),
    createMovie('B', 0, '2023-01-02'),
  ];

  const state2 = getSortedMovies(movies2, state1);

  assert.deepEqual(state2.sortedMovies.map(m => m.id), ['A', 'B']);
  assert.notStrictEqual(state2.sortedIndices, state1.sortedIndices);
});

test('getSortedMovies re-sorts when movie list length changes', () => {
  const movies1: Movie[] = [
    createMovie('A', 0, '2023-01-01'),
  ];
  const state1 = getSortedMovies(movies1);

  const movies2: Movie[] = [
    createMovie('A', 0, '2023-01-01'),
    createMovie('B', 0, '2023-01-02'),
  ];

  const state2 = getSortedMovies(movies2, state1);
  assert.deepEqual(state2.sortedMovies.map(m => m.id), ['B', 'A']);
});

test('getSortedMovies re-sorts when order in input array changes (ID mismatch)', () => {
  const movies1: Movie[] = [
    createMovie('A', 0, '2023-01-01'),
    createMovie('B', 0, '2023-01-02'),
  ];
  const state1 = getSortedMovies(movies1);
  // Expected: B, A

  // Swap order in input array (simulating Gist reorder or fetch inconsistency)
  const movies2: Movie[] = [
    createMovie('B', 0, '2023-01-02'),
    createMovie('A', 0, '2023-01-01'),
  ];

  // If optimization was naive, it might map index 0 (was A) to new index 0 (is B).
  // But our check verifies ID.
  const state2 = getSortedMovies(movies2, state1);

  assert.deepEqual(state2.sortedMovies.map(m => m.id), ['B', 'A']);
});
