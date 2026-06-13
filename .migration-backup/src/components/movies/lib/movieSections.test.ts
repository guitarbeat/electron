import assert from 'node:assert/strict';
import test from 'node:test';

import type { Movie, MovieSuggestion } from '../../../shared/types.ts';
import { buildMovieSections } from './movieSections.ts';

const MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Arrival',
    addedBy: 'Aaron',
    watchedBy: [],
    createdAt: '2026-03-20T10:00:00.000Z',
  },
  {
    id: 'm2',
    title: 'Moonlight',
    addedBy: 'Electra',
    watchedBy: ['Aaron', 'Electra'],
    createdAt: '2026-03-21T10:00:00.000Z',
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

test('buildMovieSections groups suggestions, up-next, and watched titles for inline rendering', () => {
  const sections = buildMovieSections(MOVIES, PENDING_SUGGESTIONS);

  assert.deepEqual(sections.suggestions.map((suggestion: MovieSuggestion) => suggestion.title), ['Perfect Blue']);
  assert.deepEqual(sections.queue.map((movie: Movie) => movie.title), ['Arrival']);
  assert.deepEqual(sections.completed.map((movie: Movie) => movie.title), ['Moonlight']);
});
