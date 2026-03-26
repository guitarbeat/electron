import assert from 'node:assert/strict';
import test from 'node:test';

import type { Place } from '@/shared/types';
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

test('buildPlaceSections groups queue and visited places for inline rendering', () => {
  const sections = buildPlaceSections(PLACES);

  assert.deepEqual(sections.queue.map((place) => place.name), ['Museum Cafe']);
  assert.deepEqual(sections.visited.map((place) => place.name), ['Sunset Pier']);
});
