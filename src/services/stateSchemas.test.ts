import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizePlaceSuggestionRecord, normalizePlaceSuggestions } from './stateSchemas.ts';

test('normalizePlaceSuggestionRecord', async (t) => {
  await t.test('accepts valid record', () => {
    const raw = {
      id: 'ps1',
      name: 'Test Place',
      suggestedBy: 'Aaron',
      status: 'pending',
      createdAt: '2026-03-27T10:00:00.000Z',
    };

    const normalized = normalizePlaceSuggestionRecord(raw);
    assert.notEqual(normalized, null);
    assert.equal(normalized?.id, 'ps1');
    assert.equal(normalized?.name, 'Test Place');
    assert.equal(normalized?.status, 'pending');
    assert.equal(normalized?.suggestedBy, 'Aaron');
  });

  await t.test('rejects missing required fields', () => {
    assert.equal(normalizePlaceSuggestionRecord({ id: 'ps1' }), null);
    assert.equal(normalizePlaceSuggestionRecord({ name: 'Test Place' }), null);
  });

  await t.test('rejects invalid user', () => {
    const raw = {
      id: 'ps1',
      name: 'Test Place',
      suggestedBy: 'Unknown',
      status: 'pending',
      createdAt: '2026-03-27T10:00:00.000Z',
    };
    assert.equal(normalizePlaceSuggestionRecord(raw), null);
  });

  await t.test('rejects invalid status', () => {
    const raw = {
      id: 'ps1',
      name: 'Test Place',
      suggestedBy: 'Aaron',
      status: 'unknown',
      createdAt: '2026-03-27T10:00:00.000Z',
    };
    assert.equal(normalizePlaceSuggestionRecord(raw), null);
  });

  await t.test('includes optional metadata', () => {
    const raw = {
      id: 'ps1',
      name: 'Test Place',
      suggestedBy: 'Aaron',
      status: 'pending',
      createdAt: '2026-03-27T10:00:00.000Z',
      notes: 'Some notes',
      category: 'Restaurant',
      rating: '4.5',
      imageUrl: 'https://example.com/image.jpg',
    };

    const normalized = normalizePlaceSuggestionRecord(raw);
    assert.equal(normalized?.notes, 'Some notes');
    assert.equal(normalized?.category, 'Restaurant');
    assert.equal(normalized?.rating, '4.5');
    assert.equal(normalized?.imageUrl, 'https://example.com/image.jpg');
  });
});

test('normalizePlaceSuggestions', () => {
  const raw = [
    {
      id: 'ps1',
      name: 'Test Place',
      suggestedBy: 'Aaron',
      status: 'pending',
      createdAt: '2026-03-27T10:00:00.000Z',
    },
    { invalid: 'record' },
  ];

  const normalized = normalizePlaceSuggestions(raw);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].id, 'ps1');
});
