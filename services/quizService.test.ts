import assert from 'node:assert/strict';
import { describe, test, afterEach, mock } from 'node:test';
import { getQuizData } from './quizService.ts';
import {
  quizQuestions as defaultQuestions,
  characterDescriptions as defaultDescriptions,
  neitherDescription as defaultNeither,
} from '../components/quiz/data.ts';

const expectedDefaultData = {
  questions: defaultQuestions,
  characterDescriptions: defaultDescriptions,
  neitherDescription: defaultNeither,
};

describe('Quiz Service', () => {
  afterEach(() => {
    mock.reset();
  });

  test('getQuizData returns default data and warns when token is default', async () => {
    // Spy on console.warn
    const consoleWarn = mock.method(console, 'warn', () => {});
    const mockFetch = mock.method(global, 'fetch');

    const result = await getQuizData('YOUR_GITHUB_TOKEN');

    assert.deepEqual(result, expectedDefaultData);
    assert.equal(mockFetch.mock.callCount(), 0, 'Fetch should not be called for default token');
    assert.equal(consoleWarn.mock.callCount(), 1, 'Should log a warning');

    consoleWarn.mock.restore();
  });

  test('getQuizData returns parsed data from Gist on success', async () => {
    const customData = {
      questions: [{ id: 'q1', type: 'multiple-choice', question: 'Test?', options: [] }],
      characterDescriptions: { ...defaultDescriptions },
      neitherDescription: 'New neither',
    };

    const mockFetch = mock.method(global, 'fetch', async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          files: {
            'quiz.json': {
              content: JSON.stringify(customData),
            },
          },
        }),
      } as Response;
    });

    const result = await getQuizData('valid_token');

    assert.deepEqual(result, customData);
    assert.equal(mockFetch.mock.callCount(), 1);
  });

  test('getQuizData returns default data on 401 error', async () => {
    const consoleWarn = mock.method(console, 'warn', () => {});
    const mockFetch = mock.method(global, 'fetch', async () => {
      return {
        ok: false,
        status: 401,
      } as Response;
    });

    const result = await getQuizData('valid_token');

    assert.deepEqual(result, expectedDefaultData);
    assert.equal(mockFetch.mock.callCount(), 1);
    assert.ok(consoleWarn.mock.callCount() > 0, 'Should warn on 401');

    consoleWarn.mock.restore();
  });

  test('getQuizData returns default data on 404 error', async () => {
    const consoleWarn = mock.method(console, 'warn', () => {});
    const mockFetch = mock.method(global, 'fetch', async () => {
      return {
        ok: false,
        status: 404,
      } as Response;
    });

    const result = await getQuizData('valid_token');

    assert.deepEqual(result, expectedDefaultData);
    assert.equal(mockFetch.mock.callCount(), 1);

    consoleWarn.mock.restore();
  });

  test('getQuizData returns default data on network error', async () => {
    const consoleError = mock.method(console, 'error', () => {});
    const mockFetch = mock.method(global, 'fetch', async () => {
      throw new Error('Network error');
    });

    const result = await getQuizData('valid_token');

    assert.deepEqual(result, expectedDefaultData);
    assert.equal(mockFetch.mock.callCount(), 1);
    assert.equal(consoleError.mock.callCount(), 1);

    consoleError.mock.restore();
  });

  test('getQuizData returns default data on invalid JSON content', async () => {
    const consoleError = mock.method(console, 'error', () => {});
    const mockFetch = mock.method(global, 'fetch', async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          files: {
            'quiz.json': {
              content: '{ invalid json ',
            },
          },
        }),
      } as Response;
    });

    const result = await getQuizData('valid_token');

    assert.deepEqual(result, expectedDefaultData);
    assert.equal(mockFetch.mock.callCount(), 1);
    // JSON.parse throws, caught in catch block
    assert.equal(consoleError.mock.callCount(), 1);

    consoleError.mock.restore();
  });

  test('getQuizData returns default data on missing questions array', async () => {
    const consoleWarn = mock.method(console, 'warn', () => {});
    const mockFetch = mock.method(global, 'fetch', async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          files: {
            'quiz.json': {
              content: JSON.stringify({ questions: 'not an array' }),
            },
          },
        }),
      } as Response;
    });

    const result = await getQuizData('valid_token');

    assert.deepEqual(result, expectedDefaultData);
    assert.equal(mockFetch.mock.callCount(), 1);
    assert.ok(consoleWarn.mock.callCount() > 0);

    consoleWarn.mock.restore();
  });
});
