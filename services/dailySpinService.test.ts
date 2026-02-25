import assert from 'node:assert/strict';
import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import {
  getDailySpin,
  saveDailySpin,
  updateDailySpin,
  deleteDailySpin,
  hasSpunToday,
  getTodaySpin,
} from './dailySpinService.ts';
import type { DailySpin } from '../types.ts';
import { GIST_DAILY_SPIN_FILENAME } from '../gistConfig.ts';

// A fixed Wednesday for testing
const MOCK_DATE = new Date('2024-03-20T12:00:00Z');
const TODAY_STRING = '2024-03-20';

const MOCK_SPIN: DailySpin = {
  date: TODAY_STRING,
  movieId: 'tt1234567',
  movieTitle: 'Test Movie',
  spunBy: 'Aaron',
  createdAt: new Date().toISOString(),
};

describe('dailySpinService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchMock: any;

  beforeEach((t) => {
    // Mock Date globally for the test context if possible, or try to enable it
    try {
      if (t && t.mock && t.mock.timers) {
        t.mock.timers.enable({ apis: ['Date'], now: MOCK_DATE });
      }
    } catch (e: any) {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      // Ignore if already enabled
      if (e.code !== 'ERR_INVALID_STATE') {
        throw e;
      }
    }

    // Create a fresh mock for each test
    fetchMock = mock.method(global, 'fetch');
  });

  afterEach(() => {
    if (fetchMock) {
      fetchMock.mock.restore();
    }
  });

  describe('getDailySpin', () => {
    it('returns spin data when fetch succeeds', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            files: {
              [GIST_DAILY_SPIN_FILENAME]: {
                content: JSON.stringify(MOCK_SPIN),
              },
            },
          }),
          { status: 200 }
        );
      });

      const result = await getDailySpin();
      assert.deepEqual(result, MOCK_SPIN);
    });

    it('returns null when file does not exist', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            files: {}, // Empty files
          }),
          { status: 200 }
        );
      });

      const result = await getDailySpin();
      assert.equal(result, null);
    });

    it('returns null when fetch fails (500)', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(null, { status: 500 });
      });

      const result = await getDailySpin();
      assert.equal(result, null);
    });

    it('returns null when fetch throws network error', async () => {
      fetchMock.mock.mockImplementation(async () => {
        throw new Error('Network error');
      });

      const result = await getDailySpin();
      assert.equal(result, null);
    });
  });

  describe('saveDailySpin', () => {
    it('successfully saves spin data', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({}), { status: 200 });
      });

      await saveDailySpin(MOCK_SPIN);

      assert.equal(fetchMock.mock.callCount(), 1);
      const callArgs = fetchMock.mock.calls[0].arguments;
      const options = callArgs[1] as RequestInit;

      assert.equal(options.method, 'PATCH');
      const body = JSON.parse(options.body as string);
      const content = JSON.parse(body.files[GIST_DAILY_SPIN_FILENAME].content);
      assert.deepEqual(content, MOCK_SPIN);
    });

    it('throws error when fetch fails', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({ message: 'Error' }), { status: 500 });
      });

      await assert.rejects(async () => {
        await saveDailySpin(MOCK_SPIN);
      }, /GitHub API responded with 500/);
    });
  });

  describe('updateDailySpin', () => {
    it('successfully updates existing spin', async () => {
      // Use explicit implementation to handle multiple calls
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      fetchMock.mock.mockImplementation(async (_url: string, init: RequestInit) => {
        // If it's a PATCH, it's the save call
        if (init && init.method === 'PATCH') {
          return new Response(JSON.stringify({}), { status: 200 });
        }
        // Otherwise assume GET
        return new Response(
          JSON.stringify({
            files: {
              [GIST_DAILY_SPIN_FILENAME]: {
                content: JSON.stringify(MOCK_SPIN),
              },
            },
          }),
          { status: 200 }
        );
      });

      const updates = { movieTitle: 'Updated Title' };
      const result = await updateDailySpin(updates);

      assert.equal(result.movieTitle, 'Updated Title');
      assert.equal(result.movieId, MOCK_SPIN.movieId); // Should preserve other fields

      // Verify save call
      assert.equal(fetchMock.mock.callCount(), 2);

      const saveCallArgs = fetchMock.mock.calls[1].arguments;
      const options = saveCallArgs[1] as RequestInit;
      const body = JSON.parse(options.body as string);
      const savedContent = JSON.parse(body.files[GIST_DAILY_SPIN_FILENAME].content);

      assert.equal(savedContent.movieTitle, 'Updated Title');
    });

    it('throws error when no daily spin exists', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            files: {},
          }),
          { status: 200 }
        );
      });

      await assert.rejects(async () => {
        await updateDailySpin({ movieTitle: 'Updated Title' });
      }, /No daily spin exists to update/);
    });
  });

  describe('deleteDailySpin', () => {
    it('successfully clears spin data', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({}), { status: 200 });
      });

      await deleteDailySpin();

      assert.equal(fetchMock.mock.callCount(), 1);
      const callArgs = fetchMock.mock.calls[0].arguments;
      const options = callArgs[1] as RequestInit;

      assert.equal(options.method, 'PATCH');
      const body = JSON.parse(options.body as string);
      assert.equal(body.files[GIST_DAILY_SPIN_FILENAME].content, '');
    });

    it('throws error when fetch fails', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({ message: 'Error' }), { status: 500 });
      });

      await assert.rejects(async () => {
        await deleteDailySpin();
      }, /GitHub API responded with 500/);
    });
  });

  describe('hasSpunToday', () => {
    it('returns true when spin date matches today', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            files: {
              [GIST_DAILY_SPIN_FILENAME]: {
                content: JSON.stringify(MOCK_SPIN),
              },
            },
          }),
          { status: 200 }
        );
      });

      const result = await hasSpunToday();
      assert.equal(result, true);
    });

    it('returns false when spin date is different', async () => {
      const oldSpin = { ...MOCK_SPIN, date: '2024-03-19' };
      fetchMock.mock.mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            files: {
              [GIST_DAILY_SPIN_FILENAME]: {
                content: JSON.stringify(oldSpin),
              },
            },
          }),
          { status: 200 }
        );
      });

      const result = await hasSpunToday();
      assert.equal(result, false);
    });

    it('returns false when fetch fails', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(null, { status: 500 });
      });

      const result = await hasSpunToday();
      assert.equal(result, false);
    });
  });

  describe('getTodaySpin', () => {
    it('returns spin when date matches today', async () => {
      fetchMock.mock.mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            files: {
              [GIST_DAILY_SPIN_FILENAME]: {
                content: JSON.stringify(MOCK_SPIN),
              },
            },
          }),
          { status: 200 }
        );
      });

      const result = await getTodaySpin();
      assert.deepEqual(result, MOCK_SPIN);
    });

    it('returns null when spin date is different', async () => {
      const oldSpin = { ...MOCK_SPIN, date: '2024-03-19' };
      fetchMock.mock.mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            files: {
              [GIST_DAILY_SPIN_FILENAME]: {
                content: JSON.stringify(oldSpin),
              },
            },
          }),
          { status: 200 }
        );
      });

      const result = await getTodaySpin();
      assert.equal(result, null);
    });
  });
});
