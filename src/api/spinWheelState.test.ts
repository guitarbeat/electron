import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeDailySpinRecord,
  normalizeSpinHistoryParsed,
} from '../services/stateSchemas.ts';

test('normalizeSpinHistoryParsed accepts string titles', () => {
  assert.deepEqual(normalizeSpinHistoryParsed(['A', 'B']), ['A', 'B']);
});

test('normalizeSpinHistoryParsed maps legacy objects', () => {
  assert.deepEqual(
    normalizeSpinHistoryParsed([{ title: 'X' }, { movieTitle: 'Y' }]),
    ['X', 'Y']
  );
});

test('normalizeSpinHistoryParsed drops invalid entries', () => {
  assert.deepEqual(normalizeSpinHistoryParsed([{}, 'ok', 3]), ['ok']);
});

test('normalizeDailySpinRecord accepts valid record', () => {
  const r = normalizeDailySpinRecord({
    date: '2026-03-22',
    movieId: 'm1',
    movieTitle: 'Test',
    spunBy: 'Aaron',
    createdAt: '2026-03-22T12:00:00.000Z',
  });
  assert.ok(r);
  assert.equal(r?.movieTitle, 'Test');
  assert.equal(r?.spunBy, 'Aaron');
});

test('normalizeDailySpinRecord rejects bad spunBy', () => {
  assert.equal(
    normalizeDailySpinRecord({
      date: '2026-03-22',
      movieId: 'm1',
      movieTitle: 'Test',
      spunBy: 'Guest',
      createdAt: '2026-03-22T12:00:00.000Z',
    }),
    null
  );
});
