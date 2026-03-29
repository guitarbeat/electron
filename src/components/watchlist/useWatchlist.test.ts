import assert from 'node:assert/strict';
import test from 'node:test';

import { getMovieSelectionFromSuggestion } from './useWatchlist.ts';

test('getMovieSelectionFromSuggestion forwards stored suggestion identity to addMovie', async (t) => {
  await t.test('returns imdbID and type when both are present', () => {
    assert.deepEqual(
      getMovieSelectionFromSuggestion({
        imdbID: 'tt0113277',
        type: 'movie',
      }),
      {
        imdbID: 'tt0113277',
        type: 'movie',
      }
    );
  });

  await t.test('falls back to undefined for legacy suggestions without selection metadata', () => {
    assert.equal(
      getMovieSelectionFromSuggestion({
        imdbID: undefined,
        type: undefined,
      }),
      undefined
    );
  });
});
