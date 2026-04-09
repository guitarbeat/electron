import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMovieRecord,
  isMovieRecord,
  normalizeMovies,
  cloneMovies
} from './movieRecords.ts';

describe('movieRecords', () => {
  describe('normalizeMovieRecord', () => {
    it('returns null for non-objects', () => {
      assert.equal(normalizeMovieRecord(null), null);
      assert.equal(normalizeMovieRecord(undefined), null);
      assert.equal(normalizeMovieRecord('string'), null);
      assert.equal(normalizeMovieRecord(123), null);
      assert.equal(normalizeMovieRecord(true), null);
    });

    it('returns null if required fields are missing', () => {
      assert.equal(normalizeMovieRecord({}), null);
      assert.equal(normalizeMovieRecord({ title: 'Test', addedBy: 'Aaron', createdAt: '2023-01-01' }), null); // Missing id
      assert.equal(normalizeMovieRecord({ id: '1', addedBy: 'Aaron', createdAt: '2023-01-01' }), null); // Missing title
      assert.equal(normalizeMovieRecord({ id: '1', title: 'Test', createdAt: '2023-01-01' }), null); // Missing addedBy
      assert.equal(normalizeMovieRecord({ id: '1', title: 'Test', addedBy: 'Aaron' }), null); // Missing createdAt
    });

    it('returns null if required fields are invalid types', () => {
      assert.equal(normalizeMovieRecord({ id: 1, title: 'Test', addedBy: 'Aaron', createdAt: '2023-01-01' }), null);
      assert.equal(normalizeMovieRecord({ id: '1', title: 2, addedBy: 'Aaron', createdAt: '2023-01-01' }), null);
      assert.equal(normalizeMovieRecord({ id: '1', title: 'Test', addedBy: 'InvalidUser', createdAt: '2023-01-01' }), null);
      assert.equal(normalizeMovieRecord({ id: '1', title: 'Test', addedBy: 'Aaron', createdAt: 'invalid-date' }), null);
    });

    it('normalizes a valid basic movie record', () => {
      const input = {
        id: '123',
        title: ' The Matrix ',
        addedBy: 'Electra',
        createdAt: '2023-01-01T12:00:00Z',
      };
      const result = normalizeMovieRecord(input);
      assert.deepEqual(result, {
        id: '123',
        title: 'The Matrix',
        addedBy: 'Electra',
        createdAt: '2023-01-01T12:00:00Z',
        watchedBy: [],
        posterUrl: undefined,
        year: undefined,
        plot: undefined,
        imdbRating: undefined,
        runtime: undefined,
        genre: undefined,
        director: undefined,
        category: undefined,
      });
    });

    it('sanitizes string fields', () => {
       const input = {
        id: '  123  ',
        title: '  The Matrix  ',
        addedBy: 'Aaron',
        createdAt: '2023-01-01T12:00:00Z',
        year: ' 1999 ',
        plot: ' A hacker learns the truth. ',
      };
      const result = normalizeMovieRecord(input);
      assert.equal(result?.id, '123');
      assert.equal(result?.title, 'The Matrix');
      assert.equal(result?.year, '1999');
      assert.equal(result?.plot, 'A hacker learns the truth.');
    });

    it('normalizes watchedBy array', () => {
       const input = {
        id: '123',
        title: 'The Matrix',
        addedBy: 'Aaron',
        createdAt: '2023-01-01T12:00:00Z',
        watchedBy: ['Aaron', 'Electra', 'InvalidUser', 'Aaron'],
      };
      const result = normalizeMovieRecord(input);
      assert.deepEqual(result?.watchedBy, ['Aaron', 'Electra']); // Deduplicated and filtered
    });

    it('normalizes posterUrl correctly', () => {
       const getMovie = (url: unknown) => normalizeMovieRecord({
        id: '1', title: 'A', addedBy: 'Aaron', createdAt: '2023-01-01T12:00:00Z', posterUrl: url
       });

       assert.equal(getMovie('not-a-url')?.posterUrl, undefined);
       assert.equal(getMovie('http://example.com/image.jpg')?.posterUrl, 'https://example.com/image.jpg'); // upgrades http to https
       assert.equal(getMovie('https://example.com/image.jpg')?.posterUrl, 'https://example.com/image.jpg');
    });
  });

  describe('isMovieRecord', () => {
    it('returns true for valid records', () => {
      assert.equal(isMovieRecord({ id: '1', title: 'A', addedBy: 'Aaron', createdAt: '2023-01-01T12:00:00Z' }), true);
    });

    it('returns false for invalid records', () => {
      assert.equal(isMovieRecord({ id: '1', title: 'A' }), false);
      assert.equal(isMovieRecord(null), false);
    });
  });

  describe('normalizeMovies', () => {
    it('filters out invalid records and normalizes valid ones', () => {
       const inputs = [
         { id: '1', title: 'Movie 1', addedBy: 'Aaron', createdAt: '2023-01-01T12:00:00Z' },
         { id: '2', title: 'Movie 2' }, // invalid
         { id: '3', title: 'Movie 3', addedBy: 'Electra', createdAt: '2023-01-01T12:00:00Z' },
         null,
         undefined,
       ];

       const result = normalizeMovies(inputs);
       assert.equal(result.length, 2);
       assert.equal(result[0]?.id, '1');
       assert.equal(result[1]?.id, '3');
    });
  });

  describe('cloneMovies', () => {
    it('deep clones the watchedBy array', () => {
       const movies = [
         {
           id: '1',
           title: 'A',
           addedBy: 'Aaron' as const,
           createdAt: '2023-01-01T12:00:00Z',
           watchedBy: ['Aaron' as const]
         }
       ];

       const cloned = cloneMovies(movies);

       assert.deepEqual(cloned, movies);
       assert.notEqual(cloned, movies);
       assert.notEqual(cloned[0], movies[0]);
       assert.notEqual(cloned[0]?.watchedBy, movies[0]?.watchedBy);

       if (cloned[0]?.watchedBy) {
         cloned[0].watchedBy.push('Electra' as const);
       }

       assert.deepEqual(movies[0]?.watchedBy, ['Aaron']);
       assert.deepEqual(cloned[0]?.watchedBy, ['Aaron', 'Electra']);
    });
  });
});
