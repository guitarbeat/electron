import assert from 'node:assert/strict';
import test from 'node:test';

import type { Place, PlaceSuggestion } from '../../../shared/types.ts';
import { buildPlaceSections } from './placeSections.ts';

const PLACES: Place[] = [
  {
    id: 'p1',
    name: 'Museum Cafe',
    createdAt: '2026-03-20T10:00:00.000Z',
  },
  {
    id: 'p2',
    name: 'Sunset Pier',
    createdAt: '2026-03-21T10:00:00.000Z',
    visitedAt: '2026-03-22T10:00:00.000Z',
  },
];

const PENDING_SUGGESTIONS: PlaceSuggestion[] = [
  {
    id: 'ps1',
    name: 'New Restaurant',
    suggestedBy: 'Aaron',
    createdAt: '2026-03-23T10:00:00.000Z',
    status: 'pending',
  },
];

test('buildPlaceSections groups queue, visited, and suggestions for inline rendering', () => {
  const sections = buildPlaceSections(PLACES, PENDING_SUGGESTIONS);

  assert.deepEqual(sections.queue.map((place: Place) => place.name), ['Museum Cafe']);
  assert.deepEqual(sections.completed.map((place: Place) => place.name), ['Sunset Pier']);
  assert.deepEqual(sections.suggestions.map((ps: PlaceSuggestion) => ps.name), ['New Restaurant']);
});
