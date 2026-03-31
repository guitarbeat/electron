import assert from 'node:assert/strict';
import test from 'node:test';
import { getQuizLaunchState, getShellActionMeta, getWorkspaceMeta } from './shellState.ts';

test('getQuizLaunchState', async (t) => {
  await t.test('falls back to edit mode when no profile is active', () => {
    const state = getQuizLaunchState({
      currentUser: null,
      quizCompleted: false,
    });

    assert.equal(state.label, 'Take Quiz');
    assert.equal('description' in state, false);
  });

  await t.test('starts quiz for an active user who has not completed it', () => {
    const state = getQuizLaunchState({
      currentUser: 'Aaron',
      quizCompleted: false,
    });

    assert.equal(state.label, 'Start Quiz');
    assert.equal('description' in state, false);
  });

  await t.test('retakes quiz for an active user with a completed run', () => {
    const state = getQuizLaunchState({
      currentUser: 'Electra',
      quizCompleted: true,
    });

    assert.equal(state.label, 'Retake Quiz');
    assert.equal('description' in state, false);
  });
});

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
  await t.test('returns three shell actions for the movie workspace', () => {
    const actions = getShellActionMeta({
      activeTab: 'queue',
      currentUser: 'Aaron',
      quizCompleted: false,
    });

    assert.deepEqual(
      actions.map((action) => action.id),
      ['messages', 'quiz', 'spin-match']
    );
    assert.deepEqual(
      actions.map((action) => action.label),
      ['Messages', 'Start Quiz', 'Spin & Match']
    );
  });

  await t.test('limits places to global actions only', () => {
    const actions = getShellActionMeta({
      activeTab: 'places',
      currentUser: 'Electra',
      quizCompleted: true,
    });

    assert.deepEqual(
      actions.map((action) => action.id),
      ['messages', 'quiz']
    );
    assert.deepEqual(
      actions.map((action) => action.label),
      ['Messages', 'Retake Quiz']
    );
  });
});
