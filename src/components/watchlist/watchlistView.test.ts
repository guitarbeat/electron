import assert from 'node:assert/strict';
import test from 'node:test';

import type { Movie, MovieSuggestion } from '../../shared/types.ts';
import {
  buildWatchlistTabView,
  getWatchlistTabCounts,
} from './watchlistView.ts';

const MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Arrival',
    addedBy: 'Aaron',
    watchedBy: [],
    createdAt: '2026-03-20T10:00:00.000Z',
    year: '2016',
  },
  {
    id: 'm2',
    title: 'Moonlight',
    addedBy: 'Electra',
    watchedBy: ['Aaron', 'Electra'],
    createdAt: '2026-03-21T10:00:00.000Z',
    year: '2016',
  },
];

const PENDING_SUGGESTIONS: MovieSuggestion[] = [
  {
    id: 's1',
    title: 'Perfect Blue',
    suggestedBy: 'Electra',
    status: 'pending',
    createdAt: '2026-03-22T10:00:00.000Z',
    reason: 'Stylish chaos',
  },
];

test('getWatchlistTabCounts returns queue, watched, and suggestion totals', () => {
  assert.deepEqual(getWatchlistTabCounts(MOVIES, PENDING_SUGGESTIONS), {
    queue: 1,
    watched: 1,
    suggestions: 1,
  });
});

test('buildWatchlistTabView returns suggestion cards for the suggestions tab', () => {
  const view = buildWatchlistTabView({
    contentTab: 'suggestions',
    movies: MOVIES,
    pendingSuggestions: PENDING_SUGGESTIONS,
    sortMode: 'recent',
    searchQuery: 'perfect',
  });

  assert.equal(view.movies.length, 0);
  assert.equal(view.suggestions.length, 1);
  assert.equal(view.suggestions[0]?.title, 'Perfect Blue');
  assert.deepEqual(view.surprisePool, ['Perfect Blue']);
});

test('buildWatchlistTabView filters watched movies separately from queue movies', () => {
  const view = buildWatchlistTabView({
    contentTab: 'watched',
    movies: MOVIES,
    pendingSuggestions: PENDING_SUGGESTIONS,
    sortMode: 'title',
    searchQuery: '',
  });

  assert.deepEqual(view.movies.map((movie) => movie.title), ['Moonlight']);
  assert.equal(view.suggestions.length, 0);
});
