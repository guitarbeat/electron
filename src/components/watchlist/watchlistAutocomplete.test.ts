import assert from 'node:assert/strict';
import test from 'node:test';

import type { MovieAutocompleteResult } from '@/services/metadataService';
import {
  getNextMovieAutocompleteIndex,
  shouldClearSelectedMovieResult,
  shouldFetchMovieAutocomplete,
} from './watchlistAutocomplete.ts';

const SELECTED_RESULT: MovieAutocompleteResult = {
  imdbID: 'tt0113277',
  title: 'Heat',
  type: 'movie',
  year: '1995',
  posterUrl: 'https://images.example/heat.jpg',
};

test('shouldFetchMovieAutocomplete enforces the minimum query length and skips matched selections', async (t) => {
  await t.test('does not search for very short queries', () => {
    assert.equal(shouldFetchMovieAutocomplete('h', null), false);
  });

  await t.test('does not re-search when the selected title still matches the query', () => {
    assert.equal(shouldFetchMovieAutocomplete('  HEAT  ', SELECTED_RESULT), false);
  });

  await t.test('searches again after the user edits away from the selected title', () => {
    assert.equal(shouldFetchMovieAutocomplete('Heat 2', SELECTED_RESULT), true);
  });
});

test('shouldClearSelectedMovieResult only clears after the input diverges from the selection', async (t) => {
  await t.test('keeps the selection when casing or whitespace changes only', () => {
    assert.equal(shouldClearSelectedMovieResult(' heat ', SELECTED_RESULT), false);
  });

  await t.test('clears the selection after the title changes', () => {
    assert.equal(shouldClearSelectedMovieResult('Collateral', SELECTED_RESULT), true);
  });
});

test('getNextMovieAutocompleteIndex wraps keyboard navigation through the result list', async (t) => {
  await t.test('moves forward through results and loops back to the top', () => {
    assert.equal(getNextMovieAutocompleteIndex(-1, 'next', 3), 0);
    assert.equal(getNextMovieAutocompleteIndex(0, 'next', 3), 1);
    assert.equal(getNextMovieAutocompleteIndex(2, 'next', 3), 0);
  });

  await t.test('moves backward through results and loops to the end', () => {
    assert.equal(getNextMovieAutocompleteIndex(-1, 'previous', 3), 2);
    assert.equal(getNextMovieAutocompleteIndex(2, 'previous', 3), 1);
    assert.equal(getNextMovieAutocompleteIndex(0, 'previous', 3), 2);
  });

  await t.test('returns -1 when there are no results', () => {
    assert.equal(getNextMovieAutocompleteIndex(0, 'next', 0), -1);
  });
});
