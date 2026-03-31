import assert from 'node:assert/strict';
import test from 'node:test';
import { getShellActionMeta, getWorkspaceMeta } from './shellState.ts';

test('getWorkspaceMeta', async (t) => {
  await t.test('returns movie workspace copy', () => {
    const meta = getWorkspaceMeta('queue');

    assert.equal(meta.title, 'Watchlist');
    assert.equal(meta.icon, '🎬');
    assert.equal('description' in meta, false);
  });

  await t.test('returns places workspace copy', () => {
    const meta = getWorkspaceMeta('places');

    assert.equal(meta.title, 'Date Ideas');
    assert.equal(meta.icon, '📍');
    assert.equal('description' in meta, false);
  });
});

test('getShellActionMeta', async (t) => {
  await t.test('returns only spin-match for the movie workspace', () => {
    const actions = getShellActionMeta({ activeTab: 'queue' });

    assert.deepEqual(
      actions.map((action) => action.id),
      ['spin-match']
    );
    assert.deepEqual(
      actions.map((action) => action.label),
      ['Spin & Match']
    );
  });

  await t.test('returns no actions for the places workspace', () => {
    const actions = getShellActionMeta({ activeTab: 'places' });

    assert.deepEqual(actions, []);
  });
});
