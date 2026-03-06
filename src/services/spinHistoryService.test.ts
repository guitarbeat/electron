import assert from 'node:assert/strict';
import { test, describe, beforeEach, after, mock } from 'node:test';
import {
  getSpinHistory,
  saveSpinHistory,
  addSpinEntry,
  updateSpinEntry,
  deleteSpinEntry,
  upsertTodaySpinEntry,
} from './spinHistoryService.ts';
import { GIST_SPIN_HISTORY_FILENAME } from '@/config/gistConfig.ts';
import type { SpinHistory } from '@/types.ts';

const MOCK_DATE = new Date('2024-03-20T12:00:00Z');

describe('spinHistoryService', () => {
  // Mock timers to freeze time
  mock.timers.enable({ apis: ['Date'], now: MOCK_DATE });

  // Mock global.fetch
  const fetchMock = mock.method(global, 'fetch');

  // Restore mocks after all tests
  after(() => {
    mock.timers.reset();
    fetchMock.mock.restore();
  });

  // Reset mock calls before each test
  beforeEach(() => {
    fetchMock.mock.resetCalls();
  });

  describe('getSpinHistory', () => {
    test('returns parsed history on success', async () => {
      const mockHistory: SpinHistory = [
        {
          id: '1',
          date: '2024-03-19',
          movieId: 'm1',
          movieTitle: 'Movie 1',
          spunBy: 'Aaron',
          createdAt: '2024-03-19T12:00:00Z',
        },
      ];

      fetchMock.mock.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            files: {
              [GIST_SPIN_HISTORY_FILENAME]: {
                content: JSON.stringify(mockHistory),
              },
            },
          }),
          { status: 200 }
        );
      });

      const result = await getSpinHistory();
      assert.deepEqual(result, mockHistory);
    });

    test('returns empty array when file is missing', async () => {
      fetchMock.mock.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            files: {},
          }),
          { status: 200 }
        );
      });

      const result = await getSpinHistory();
      assert.deepEqual(result, []);
    });

    test('returns empty array when file content is empty', async () => {
      fetchMock.mock.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            files: {
              [GIST_SPIN_HISTORY_FILENAME]: {
                content: '',
              },
            },
          }),
          { status: 200 }
        );
      });

      const result = await getSpinHistory();
      assert.deepEqual(result, []);
    });

    test('throws error on fetch failure', async () => {
      fetchMock.mock.mockImplementationOnce(async () => {
        return new Response(null, { status: 500 });
      });

      await assert.rejects(getSpinHistory(), /GitHub API responded with 500/);
    });
  });

  describe('saveSpinHistory', () => {
    test('saves history successfully', async () => {
      const mockHistory: SpinHistory = [
        {
          id: '1',
          date: '2024-03-20',
          movieId: 'm1',
          movieTitle: 'Movie 1',
          spunBy: 'Aaron',
          createdAt: '2024-03-20T12:00:00Z',
        },
      ];

      fetchMock.mock.mockImplementationOnce(async () => {
        return new Response(JSON.stringify({}), { status: 200 });
      });

      await saveSpinHistory(mockHistory);

      assert.equal(fetchMock.mock.callCount(), 1);
      const call = fetchMock.mock.calls[0];
      const options = call.arguments[1] as RequestInit;

      assert.equal(options.method, 'PATCH');
      const body = JSON.parse(options.body as string);
      const savedContent = JSON.parse(body.files[GIST_SPIN_HISTORY_FILENAME].content);
      assert.deepEqual(savedContent, mockHistory);
    });

    test('throws error on save failure', async () => {
      fetchMock.mock.mockImplementationOnce(async () => {
        return new Response(JSON.stringify({ message: 'Error' }), { status: 500 });
      });

      await assert.rejects(saveSpinHistory([]), /GitHub API responded with 500/);
    });
  });

  describe('addSpinEntry', () => {
    test('adds new entry to history', async () => {
      const initialHistory: SpinHistory = [];
      const newEntryData = {
        date: '2024-03-20',
        movieId: 'm1',
        movieTitle: 'Movie 1',
        spunBy: 'Aaron' as const,
      };

      let callCount = 0;
      fetchMock.mock.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              files: {
                [GIST_SPIN_HISTORY_FILENAME]: {
                  content: JSON.stringify(initialHistory),
                },
              },
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const result = await addSpinEntry(newEntryData);

      assert.equal(result.movieId, newEntryData.movieId);
      assert.equal(result.movieTitle, newEntryData.movieTitle);
      assert.equal(result.spunBy, newEntryData.spunBy);
      assert.equal(result.date, newEntryData.date);
      assert.ok(result.id);
      assert.equal(result.createdAt, MOCK_DATE.toISOString());

      assert.equal(fetchMock.mock.callCount(), 2);
      const saveCall = fetchMock.mock.calls[1];
      const saveBody = JSON.parse((saveCall.arguments[1] as RequestInit).body as string);
      const savedHistory = JSON.parse(saveBody.files[GIST_SPIN_HISTORY_FILENAME].content);

      assert.equal(savedHistory.length, 1);
      assert.deepEqual(savedHistory[0], result);
    });
  });

  describe('updateSpinEntry', () => {
    test('updates existing entry', async () => {
      const existingEntry = {
        id: 'existing-id',
        date: '2024-03-19',
        movieId: 'm1',
        movieTitle: 'Movie 1',
        spunBy: 'Aaron' as const,
        createdAt: '2024-03-19T10:00:00Z',
      };
      const initialHistory: SpinHistory = [existingEntry];

      let callCount = 0;
      fetchMock.mock.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              files: {
                [GIST_SPIN_HISTORY_FILENAME]: {
                  content: JSON.stringify(initialHistory),
                },
              },
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const updates = { movieTitle: 'Updated Title' };
      const result = await updateSpinEntry('existing-id', updates);

      assert.equal(result.id, existingEntry.id);
      assert.equal(result.movieTitle, 'Updated Title');
      assert.equal(result.updatedAt, MOCK_DATE.toISOString());

      const saveCall = fetchMock.mock.calls[1];
      const saveBody = JSON.parse((saveCall.arguments[1] as RequestInit).body as string);
      const savedHistory = JSON.parse(saveBody.files[GIST_SPIN_HISTORY_FILENAME].content);

      assert.equal(savedHistory.length, 1);
      assert.equal(savedHistory[0].movieTitle, 'Updated Title');
    });

    test('throws error if entry not found', async () => {
      fetchMock.mock.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            files: {
              [GIST_SPIN_HISTORY_FILENAME]: {
                content: JSON.stringify([]),
              },
            },
          }),
          { status: 200 }
        );
      });

      await assert.rejects(updateSpinEntry('missing-id', {}), /Spin entry not found/);
    });
  });

  describe('deleteSpinEntry', () => {
    test('deletes existing entry', async () => {
      const existingEntry = {
        id: 'to-delete',
        date: '2024-03-19',
        movieId: 'm1',
        movieTitle: 'Movie 1',
        spunBy: 'Aaron' as const,
        createdAt: '2024-03-19T10:00:00Z',
      };
      const initialHistory: SpinHistory = [existingEntry];

      let callCount = 0;
      fetchMock.mock.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              files: {
                [GIST_SPIN_HISTORY_FILENAME]: {
                  content: JSON.stringify(initialHistory),
                },
              },
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      await deleteSpinEntry('to-delete');

      const saveCall = fetchMock.mock.calls[1];
      const saveBody = JSON.parse((saveCall.arguments[1] as RequestInit).body as string);
      const savedHistory = JSON.parse(saveBody.files[GIST_SPIN_HISTORY_FILENAME].content);

      assert.equal(savedHistory.length, 0);
    });

    test('throws error if entry not found', async () => {
      fetchMock.mock.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            files: {
              [GIST_SPIN_HISTORY_FILENAME]: {
                content: JSON.stringify([]),
              },
            },
          }),
          { status: 200 }
        );
      });

      await assert.rejects(deleteSpinEntry('missing-id'), /Spin entry not found/);
    });
  });

  describe('upsertTodaySpinEntry', () => {
    test('adds new entry if none exists for today', async () => {
      const initialHistory: SpinHistory = [
        {
          id: 'old',
          date: '2024-03-19',
          movieId: 'm1',
          movieTitle: 'Old',
          spunBy: 'Aaron',
          createdAt: '2024-03-19',
        },
      ];

      let callCount = 0;
      fetchMock.mock.mockImplementation(async () => {
        callCount++;
        // 1. upsert check, 2. add check, 3. save
        if (callCount === 1 || callCount === 2) {
          return new Response(
            JSON.stringify({
              files: {
                [GIST_SPIN_HISTORY_FILENAME]: {
                  content: JSON.stringify(initialHistory),
                },
              },
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      const today = '2024-03-20';
      await upsertTodaySpinEntry(today, 'Electra', 'm2', 'New Movie');

      assert.equal(fetchMock.mock.callCount(), 3);

      const saveCall = fetchMock.mock.calls[2];
      const saveBody = JSON.parse((saveCall.arguments[1] as RequestInit).body as string);
      const savedHistory = JSON.parse(saveBody.files[GIST_SPIN_HISTORY_FILENAME].content);

      assert.equal(savedHistory.length, 2);
      assert.equal(savedHistory[0].date, today);
      assert.equal(savedHistory[0].movieTitle, 'New Movie');
    });

    test('updates existing entry if exists for today', async () => {
      const today = '2024-03-20';
      const existingEntry = {
        id: 'today-entry',
        date: today,
        movieId: 'm1',
        movieTitle: 'Old Title',
        spunBy: 'Aaron' as const,
        createdAt: '2024-03-20T10:00:00Z',
      };
      const initialHistory: SpinHistory = [existingEntry];

      let callCount = 0;
      fetchMock.mock.mockImplementation(async () => {
        callCount++;
        // 1. upsert check, 2. update check, 3. save
        if (callCount === 1 || callCount === 2) {
          return new Response(
            JSON.stringify({
              files: {
                [GIST_SPIN_HISTORY_FILENAME]: {
                  content: JSON.stringify(initialHistory),
                },
              },
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      await upsertTodaySpinEntry(today, 'Electra', 'm2', 'New Title');

      assert.equal(fetchMock.mock.callCount(), 3);

      const saveCall = fetchMock.mock.calls[2];
      const saveBody = JSON.parse((saveCall.arguments[1] as RequestInit).body as string);
      const savedHistory = JSON.parse(saveBody.files[GIST_SPIN_HISTORY_FILENAME].content);

      assert.equal(savedHistory.length, 1);
      assert.equal(savedHistory[0].id, 'today-entry');
      assert.equal(savedHistory[0].movieTitle, 'New Title');
      assert.equal(savedHistory[0].spunBy, 'Electra');
    });
  });
});
