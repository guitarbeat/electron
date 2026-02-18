import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMovieMemorySummaries, getMemoryMovieKey, sortMemories } from './memoryUtils.ts';

test('getMemoryMovieKey falls back to normalized movie title when movieId is absent', () => {
  const key = getMemoryMovieKey({
    id: 'm1',
    movieTitle: '  The Matrix  ',
    author: 'Aaron',
    note: 'Classic.',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(key, 'title:the matrix');
});

test('buildMovieMemorySummaries links by movieId and title fallback without duplication', () => {
  const movies = [
    {
      id: 'movie-1',
      title: 'The Matrix',
      addedBy: 'Aaron',
      watchedBy: ['Aaron', 'Electra'],
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const memories = [
    {
      id: 'mem-a',
      movieId: 'movie-1',
      movieTitle: 'The Matrix',
      author: 'Aaron',
      note: 'First watch.',
      createdAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'mem-b',
      movieTitle: 'the matrix',
      author: 'Electra',
      note: 'Great score.',
      createdAt: '2026-01-03T00:00:00.000Z',
    },
  ];

  const summaries = buildMovieMemorySummaries(movies, memories);
  const summary = summaries.get('movie-1');

  assert.ok(summary);
  assert.equal(summary.count, 2);
  assert.equal(summary.latest?.id, 'mem-b');
});

test('sortMemories keeps pinned entries at top for both sort modes', () => {
  const memories = [
    {
      id: 'a',
      movieTitle: 'A',
      author: 'Aaron',
      note: 'A',
      createdAt: '2026-01-01T00:00:00.000Z',
      isPinned: false,
    },
    {
      id: 'b',
      movieTitle: 'B',
      author: 'Aaron',
      note: 'B',
      createdAt: '2026-01-02T00:00:00.000Z',
      isPinned: true,
    },
    {
      id: 'c',
      movieTitle: 'C',
      author: 'Aaron',
      note: 'C',
      createdAt: '2026-01-03T00:00:00.000Z',
      isPinned: false,
    },
  ];

  const newest = sortMemories(memories, 'newest').map((memory) => memory.id);
  const oldest = sortMemories(memories, 'oldest').map((memory) => memory.id);

  assert.deepEqual(newest, ['b', 'c', 'a']);
  assert.deepEqual(oldest, ['b', 'a', 'c']);
});
