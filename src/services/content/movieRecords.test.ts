import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cloneMovies,
  normalizeMovieRecord,
  isMovieRecord,
  normalizeMovies,
} from './movieRecords.ts';

test('normalizeMovieRecord', async (t) => {
  await t.test('returns null for non-object inputs', () => {
    assert.equal(normalizeMovieRecord(null), null);
    assert.equal(normalizeMovieRecord(undefined), null);
    assert.equal(normalizeMovieRecord('string'), null);
    assert.equal(normalizeMovieRecord(123), null);
    assert.equal(normalizeMovieRecord(true), null);
  });

  await t.test('returns null if required fields are missing or invalid', () => {
    const validBase = {
      id: 'movie-1',
      title: 'The Matrix',
      addedBy: 'Aaron',
      createdAt: '2026-03-21T12:00:00.000Z',
    };

    assert.equal(normalizeMovieRecord({ ...validBase, id: undefined }), null);
    assert.equal(normalizeMovieRecord({ ...validBase, title: null }), null);
    assert.equal(normalizeMovieRecord({ ...validBase, addedBy: 'InvalidUser' }), null);
    assert.equal(normalizeMovieRecord({ ...validBase, createdAt: 'invalid-date' }), null);
  });

  await t.test('normalizes a valid movie record with minimum required fields', () => {
    const input = {
      id: 'movie-1',
      title: 'The Matrix',
      addedBy: 'Aaron',
      createdAt: '2026-03-21T12:00:00.000Z',
    };

    const expected = {
      id: 'movie-1',
      title: 'The Matrix',
      addedBy: 'Aaron',
      createdAt: '2026-03-21T12:00:00.000Z',
      watchedBy: [],
      posterUrl: undefined,
      year: undefined,
      plot: undefined,
      imdbRating: undefined,
      runtime: undefined,
      genre: undefined,
      director: undefined,
      category: undefined,
    };

    assert.deepEqual(normalizeMovieRecord(input), expected);
  });

  await t.test('normalizes optional fields and sanitizes strings', () => {
    const input = {
      id: 'movie-1',
      title: ' The Matrix ', // should be trimmed by sanitizeInput
      addedBy: 'Electra',
      createdAt: '2026-03-21T12:00:00.000Z',
      year: ' 1999 ',
      plot: '\x00\x01<script>alert(1)</script>A computer hacker...\x7F',
      imdbRating: '8.7',
      runtime: '136 min',
      genre: 'Action, Sci-Fi',
      director: 'Lana Wachowski, Lilly Wachowski',
      category: 'Sci-Fi',
    };

    const result = normalizeMovieRecord(input);
    assert.equal(result?.title, 'The Matrix');
    assert.equal(result?.year, '1999');
    assert.equal(result?.plot, '<script>alert(1)</script>A computer hacker...');
    assert.equal(result?.imdbRating, '8.7');
    assert.equal(result?.runtime, '136 min');
    assert.equal(result?.genre, 'Action, Sci-Fi');
    assert.equal(result?.director, 'Lana Wachowski, Lilly Wachowski');
    assert.equal(result?.category, 'Sci-Fi');
  });

  await t.test('filters and deduplicates watchedBy array', () => {
    const input = {
      id: 'movie-1',
      title: 'The Matrix',
      addedBy: 'Aaron',
      createdAt: '2026-03-21T12:00:00.000Z',
      watchedBy: ['Aaron', 'InvalidUser', 'Electra', 'Aaron'],
    };

    const result = normalizeMovieRecord(input);
    assert.deepEqual(result?.watchedBy, ['Aaron', 'Electra']);
  });

  await t.test('normalizes posterUrl to https and ignores invalid urls', () => {
    const base = {
      id: 'movie-1',
      title: 'The Matrix',
      addedBy: 'Aaron',
      createdAt: '2026-03-21T12:00:00.000Z',
    };

    const validHttp = normalizeMovieRecord({ ...base, posterUrl: 'http://example.com/poster.jpg' });
    assert.equal(validHttp?.posterUrl, 'https://example.com/poster.jpg');

    const validHttps = normalizeMovieRecord({ ...base, posterUrl: 'https://example.com/poster.jpg' });
    assert.equal(validHttps?.posterUrl, 'https://example.com/poster.jpg');

    const invalidUrl = normalizeMovieRecord({ ...base, posterUrl: 'not-a-url' });
    assert.equal(invalidUrl?.posterUrl, undefined);
  });
});

test('isMovieRecord', async (t) => {
  await t.test('returns true for valid movie records', () => {
    assert.equal(
      isMovieRecord({
        id: 'movie-1',
        title: 'The Matrix',
        addedBy: 'Aaron',
        createdAt: '2026-03-21T12:00:00.000Z',
      }),
      true
    );
  });

  await t.test('returns false for invalid movie records', () => {
    assert.equal(isMovieRecord(null), false);
    assert.equal(
      isMovieRecord({
        id: 'movie-1',
        title: 'The Matrix',
        // missing addedBy and createdAt
      }),
      false
    );
  });
});

test('normalizeMovies', async (t) => {
  await t.test('returns empty array for non-array input', () => {
    assert.deepEqual(normalizeMovies(null), []);
    assert.deepEqual(normalizeMovies('not array'), []);
    assert.deepEqual(normalizeMovies({ id: 'movie-1' }), []);
  });

  await t.test('filters valid records and drops invalid rows', () => {
    const input = [
      {
        id: 'movie-1',
        title: 'First',
        addedBy: 'Aaron',
        createdAt: '2026-03-21T12:00:00.000Z',
      },
      {
        id: 'movie-2',
        title: 'Invalid', // missing addedBy and createdAt
      },
      {
        id: 'movie-3',
        title: 'Second',
        addedBy: 'Electra',
        createdAt: '2026-03-21T13:00:00.000Z',
      },
    ];

    const result = normalizeMovies(input);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 'movie-1');
    assert.equal(result[1].id, 'movie-3');
  });
});

test('cloneMovies', async (t) => {
  await t.test('returns a new array with cloned movie objects and cloned watchedBy', () => {
    const original = [
      {
        id: 'movie-1',
        title: 'The Matrix',
        addedBy: 'Aaron' as const,
        watchedBy: ['Electra' as const],
        createdAt: '2026-03-21T12:00:00.000Z',
      },
    ];

    const cloned = cloneMovies(original);

    assert.deepEqual(cloned, original);
    assert.notEqual(cloned, original); // different array reference
    assert.notEqual(cloned[0], original[0]); // different object reference
    assert.notEqual(cloned[0].watchedBy, original[0].watchedBy); // different watchedBy array reference
  });
});
