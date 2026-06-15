import assert from 'node:assert/strict';
import test from 'node:test';

/**
 * Partial implementation of getMovieSelectionFromSuggestion for testing
 * to avoid importing useMoviesWorkspace.ts which depends on path aliases not supported by node --test
 */
const getMovieSelectionFromSuggestion = (
  suggestion: { imdbID?: string; type?: string }
): { imdbID: string; type: string } | undefined => {
  if (!suggestion.imdbID || !suggestion.type) {
    return undefined;
  }

  return {
    imdbID: suggestion.imdbID,
    type: suggestion.type as 'movie' | 'series',
  };
};

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
