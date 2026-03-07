import test from 'node:test';
import assert from 'node:assert/strict';
import type { Movie, SharedMemory } from '../types.ts';
import {
  buildMovieMemorySummaries,
  formatMemoryTimestamp,
  sortMemories,
} from '../components/memories/memoryUtils.ts';

const movie: Movie = {
  id: 'm1',
  title: 'Inception',
  addedBy: 'Aaron',
  watchedBy: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

test('buildMovieMemorySummaries merges memories by movieId and title fallback', () => {
  const memories: SharedMemory[] = [
    {
      id: 'a',
      movieId: 'm1',
      movieTitle: 'Inception',
      author: 'Aaron',
      note: 'Great soundtrack',
      createdAt: '2026-01-01T10:00:00.000Z',
    },
    {
      id: 'b',
      movieTitle: '  inception  ',
      author: 'Electra',
      note: 'Mind-bending',
      createdAt: '2026-01-02T10:00:00.000Z',
    },
  ];

  const summaries = buildMovieMemorySummaries([movie], memories);
  const summary = summaries.get('m1');

  assert.ok(summary);
  assert.equal(summary?.count, 2);
  assert.equal(summary?.latest?.id, 'b');
});

test('sortMemories keeps pinned memories first for oldest mode', () => {
  const memories: SharedMemory[] = [
    {
      id: '1',
      movieTitle: 'A',
      author: 'Aaron',
      note: 'new unpinned',
      createdAt: '2026-01-03T00:00:00.000Z',
    },
    {
      id: '2',
      movieTitle: 'A',
      author: 'Electra',
      note: 'pinned',
      createdAt: '2026-01-01T00:00:00.000Z',
      isPinned: true,
    },
    {
      id: '3',
      movieTitle: 'A',
      author: 'Aaron',
      note: 'old unpinned',
      createdAt: '2026-01-02T00:00:00.000Z',
    },
  ];

  const sorted = sortMemories(memories, 'oldest');

  assert.equal(sorted[0].id, '2');
  assert.equal(sorted[1].id, '3');
  assert.equal(sorted[2].id, '1');
});

test('formatMemoryTimestamp handles invalid dates safely', () => {
  assert.equal(formatMemoryTimestamp('not-a-date'), 'Unknown date');
});
