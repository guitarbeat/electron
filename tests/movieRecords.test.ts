import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloneMovies,
  isMovieRecord,
  normalizeMovieRecord,
  normalizeMovies,
} from '../src/services/movieRecords.ts';

test('normalizeMovieRecord sanitizes fields and drops unsafe optional values', () => {
  const normalized = normalizeMovieRecord({
    id: ' movie-1 ',
    title: '  The Matrix \u0007 ',
    addedBy: 'Aaron',
    watchedBy: ['Aaron', 'Aaron', 'Stranger'],
    createdAt: '2026-03-12T10:00:00.000Z',
    posterUrl: `javascript${':'}alert(1)`,
    plot: '  A hacker learns the truth.  ',
    genre: '  Action, Sci-Fi  ',
    director: '  The Wachowskis  ',
    category: '  Movies  ',
  });

  assert.deepEqual(normalized, {
    id: 'movie-1',
    title: 'The Matrix',
    addedBy: 'Aaron',
    watchedBy: ['Aaron'],
    createdAt: '2026-03-12T10:00:00.000Z',
    posterUrl: undefined,
    year: undefined,
    plot: 'A hacker learns the truth.',
    imdbRating: undefined,
    runtime: undefined,
    genre: 'Action, Sci-Fi',
    director: 'The Wachowskis',
    category: 'Movies',
  });
});

test('normalizeMovieRecord rejects records missing required fields', () => {
  assert.equal(
    normalizeMovieRecord({
      id: 'movie-2',
      title: 'Missing watcher data',
      addedBy: 'Aaron',
      watchedBy: [],
      createdAt: 'not-a-date',
    }),
    null
  );

  assert.equal(
    normalizeMovieRecord({
      id: 'movie-3',
      title: '   ',
      addedBy: 'Electra',
      watchedBy: [],
      createdAt: '2026-03-12T10:00:00.000Z',
    }),
    null
  );
});

test('normalizeMovies filters invalid entries while preserving valid ones', () => {
  const movies = normalizeMovies([
    {
      id: 'movie-1',
      title: 'Alien',
      addedBy: 'Aaron',
      watchedBy: ['Electra'],
      createdAt: '2026-03-12T10:00:00.000Z',
    },
    {
      id: '',
      title: 'Broken',
      addedBy: 'Aaron',
      watchedBy: [],
      createdAt: '2026-03-12T10:00:00.000Z',
    },
    'not-an-object',
  ]);

  assert.deepEqual(movies, [
    {
      id: 'movie-1',
      title: 'Alien',
      addedBy: 'Aaron',
      watchedBy: ['Electra'],
      createdAt: '2026-03-12T10:00:00.000Z',
      posterUrl: undefined,
      year: undefined,
      plot: undefined,
      imdbRating: undefined,
      runtime: undefined,
      genre: undefined,
      director: undefined,
      category: undefined,
    },
  ]);
});

test('isMovieRecord accepts normalized movie-shaped values', () => {
  assert.equal(
    isMovieRecord({
      id: 'movie-1',
      title: 'Alien',
      addedBy: 'Electra',
      watchedBy: ['Aaron'],
      createdAt: '2026-03-12T10:00:00.000Z',
    }),
    true
  );

  assert.equal(
    isMovieRecord({
      id: 'movie-2',
      title: 'Alien',
      addedBy: 'Someone Else',
      watchedBy: ['Aaron'],
      createdAt: '2026-03-12T10:00:00.000Z',
    }),
    false
  );
});

test('cloneMovies deep clones watchedBy arrays', () => {
  const source = [
    {
      id: 'movie-1',
      title: 'Alien',
      addedBy: 'Aaron',
      watchedBy: ['Electra'],
      createdAt: '2026-03-12T10:00:00.000Z',
    },
  ] as const;

  const cloned = cloneMovies(source.map((movie) => ({ ...movie, watchedBy: [...movie.watchedBy] })));
  cloned[0].watchedBy.push('Aaron');

  assert.deepEqual(source[0].watchedBy, ['Electra']);
  assert.deepEqual(cloned[0].watchedBy, ['Electra', 'Aaron']);
});
