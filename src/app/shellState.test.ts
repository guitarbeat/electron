import assert from 'node:assert/strict';
import test from 'node:test';
import { getQuizLaunchState, getWorkspaceMeta } from './shellState.ts';

test('getQuizLaunchState', async (t) => {
  await t.test('falls back to edit mode when no profile is active', () => {
    const state = getQuizLaunchState({
      currentUser: null,
      quizCompleted: false,
    });

    assert.equal(state.label, 'Edit Quiz');
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
