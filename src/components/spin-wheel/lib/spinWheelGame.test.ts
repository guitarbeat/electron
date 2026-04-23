import assert from 'node:assert/strict';
import test from 'node:test';
import type { Movie } from '@/shared/types';
import {
  appendSpinHistory,
  buildSpinWheelGradient,
  computeSpinOutcome,
  getSpinCandidates,
  getSpinPool,
} from './spinWheelEngine.ts';

const movies: Movie[] = [
  {
    id: 'm-1',
    title: 'One',
    addedBy: 'Aaron',
    watchedBy: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm-2',
    title: 'Two',
    addedBy: 'Aaron',
    watchedBy: ['Aaron', 'Electra'],
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'm-3',
    title: 'Three',
    addedBy: 'Electra',
    watchedBy: ['Aaron'],
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

test('getSpinCandidates', async (t) => {
  await t.test('returns queue candidates when queue mode has unwatched items', () => {
    const candidates = getSpinCandidates(movies, 'queue');

    assert.deepEqual(
      candidates.map((movie) => movie.id),
      ['m-1', 'm-3']
    );
  });

  await t.test('falls back to all movies when queue mode is empty', () => {
    const candidates = getSpinCandidates(
      movies.map((movie) => ({
        ...movie,
        watchedBy: ['Aaron', 'Electra'],
      })),
      'queue'
    );

    assert.equal(candidates.length, 3);
  });
});

test('buildSpinWheelGradient', async (t) => {
  await t.test('builds an empty-state gradient with no segments', () => {
    assert.equal(buildSpinWheelGradient(0), 'conic-gradient(#444, #222)');
  });

  await t.test('builds stepped conic gradient segments', () => {
    assert.match(buildSpinWheelGradient(3), /0deg 120deg/);
    assert.match(buildSpinWheelGradient(3), /120deg 240deg/);
    assert.match(buildSpinWheelGradient(3), /240deg 360deg/);
  });
});

test('appendSpinHistory', async (t) => {
  await t.test('prepends the newest title and caps the history length', () => {
    const history = appendSpinHistory(['A', 'B', 'C'], 'D', 3);

    assert.deepEqual(history, ['D', 'A', 'B']);
  });
});

test('computeSpinOutcome', async (t) => {
  await t.test('returns a deterministic winner and next rotation', () => {
    const outcome = computeSpinOutcome(movies, 120, () => 0.5);

    assert.equal(outcome?.winner.id, 'm-2');
    assert.equal(outcome?.targetIndex, 1);
    assert.equal(outcome?.nextRotation, 2460);
  });

  await t.test('returns null when there are no candidates', () => {
    assert.equal(computeSpinOutcome([], 0, () => 0), null);
  });
});

test('getSpinPool', async (t) => {
  await t.test('uses the selected subset when selections exist', () => {
    const pool = getSpinPool(movies, 'all', new Set(['m-1', 'm-3']));

    assert.deepEqual(
      pool.map((movie) => movie.id),
      ['m-1', 'm-3']
    );
  });

  await t.test('falls back to the base candidate pool when the selection is empty', () => {
    const pool = getSpinPool(movies, 'queue', new Set());

    assert.deepEqual(
      pool.map((movie) => movie.id),
      ['m-1', 'm-3']
    );
  });

  await t.test('falls back to the base candidate pool when selected ids do not match', () => {
    const pool = getSpinPool(movies, 'all', new Set(['missing']));

    assert.deepEqual(
      pool.map((movie) => movie.id),
      ['m-1', 'm-2', 'm-3']
    );
  });
});
