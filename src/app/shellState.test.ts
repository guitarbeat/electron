import assert from 'node:assert/strict';
import test from 'node:test';
import type { QuizData } from '@/hooks/useQuiz';
import { getQuizLaunchState, getWorkspaceMeta } from './shellState.ts';

const quizData: QuizData = {
  questions: [
    {
      id: 'q-1',
      type: 'multiple-choice',
      question: 'Pick a snack.',
      options: [
        {
          text: 'Popcorn',
          scores: { Aaron: 1 },
        },
      ],
    },
  ],
  characterDescriptions: {
    Aaron: 'Aaron',
    Electra: 'Electra',
    Madeleine: 'Madeleine',
    'Nosferatu/Smeemo': 'Nosferatu/Smeemo',
  },
  neitherDescription: 'Neither',
};

test('getQuizLaunchState', async (t) => {
  await t.test('falls back to edit mode when no profile is active', () => {
    const state = getQuizLaunchState({
      currentUser: null,
      quizCompleted: false,
      quizData,
    });

    assert.equal(state.label, 'Edit Quiz');
    assert.match(state.description, /1 prompt ready/i);
  });

  await t.test('starts quiz for an active user who has not completed it', () => {
    const state = getQuizLaunchState({
      currentUser: 'Aaron',
      quizCompleted: false,
      quizData,
    });

    assert.equal(state.label, 'Start Quiz');
    assert.match(state.description, /Aaron is signed in/i);
  });

  await t.test('retakes quiz for an active user with a completed run', () => {
    const state = getQuizLaunchState({
      currentUser: 'Electra',
      quizCompleted: true,
      quizData,
    });

    assert.equal(state.label, 'Retake Quiz');
    assert.match(state.description, /Electra can take the quiz again/i);
  });
});

test('getWorkspaceMeta', async (t) => {
  await t.test('returns movie workspace copy', () => {
    const meta = getWorkspaceMeta('queue');

    assert.equal(meta.title, 'Watchlist');
    assert.equal(meta.icon, '🎬');
  });

  await t.test('returns places workspace copy', () => {
    const meta = getWorkspaceMeta('places');

    assert.equal(meta.title, 'Date Ideas');
    assert.equal(meta.icon, '📍');
  });
});
