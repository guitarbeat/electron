import assert from 'node:assert/strict';
import { mock, test, after, beforeEach } from 'node:test';
import {
  getDailySpin,
  saveDailySpin,
  updateDailySpin,
  deleteDailySpin,
  hasSpunToday,
  getTodaySpin,
} from './dailySpinService.ts';
import { GIST_DAILY_SPIN_FILENAME, GIST_API_URL } from '../config/gistConfig.ts';
import type { DailySpin } from '../types.ts';

// A fixed Wednesday for testing
const MOCK_DATE = new Date('2024-03-20T12:00:00Z');

// Mock data
const mockSpin: DailySpin = {
  date: '2024-03-20',
  movieId: '123',
  movieTitle: 'Test Movie',
  spunBy: 'Aaron',
  createdAt: '2024-03-20T10:00:00Z',
};

test('dailySpinService', async (t) => {
  // Mock Date using mock.timers to freeze time
  t.mock.timers.enable({ apis: ['Date'], now: MOCK_DATE });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchMock: any;

  // Restore fetch after all tests in this suite
  after(() => {
    if (fetchMock) fetchMock.mock.restore();
  });

  // Create fresh mock before each test
  beforeEach(() => {
    if (fetchMock) fetchMock.mock.restore();
    fetchMock = mock.method(global, 'fetch');
  });

  // Helper to create successful fetch response for GET
  const mockGistResponse = (content: string | null = null) => {
    return new Response(
      JSON.stringify({
        files: {
          [GIST_DAILY_SPIN_FILENAME]: content ? { content } : undefined,
        },
      }),
      { status: 200 }
    );
  };

  // --- getDailySpin ---
  await t.test('getDailySpin returns parsed data when file exists', async () => {
    fetchMock.mock.mockImplementationOnce(async () => mockGistResponse(JSON.stringify(mockSpin)));

    const result = await getDailySpin();
    assert.deepEqual(result, mockSpin);
  });

  await t.test('getDailySpin returns null when file is missing', async () => {
    fetchMock.mock.mockImplementationOnce(
      async () => new Response(JSON.stringify({ files: {} }), { status: 200 })
    );

    const result = await getDailySpin();
    assert.equal(result, null);
  });

  await t.test('getDailySpin returns null and logs error when fetch fails', async () => {
    const consoleErrorMock = mock.method(console, 'error', () => {});
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 500 }));

    const result = await getDailySpin();
    assert.equal(result, null);
    assert.equal(consoleErrorMock.mock.callCount(), 1);
    consoleErrorMock.mock.restore();
  });

  // --- saveDailySpin ---
  await t.test('saveDailySpin sends PATCH request with correct body', async () => {
    fetchMock.mock.mockImplementationOnce(
      async () => new Response(JSON.stringify({}), { status: 200 })
    );

    await saveDailySpin(mockSpin);

    assert.equal(fetchMock.mock.callCount(), 1);
    const call = fetchMock.mock.calls[0];
    assert.equal(call.arguments[1]?.method, 'PATCH');

    const body = JSON.parse(call.arguments[1]?.body as string);
    const content = JSON.parse(body.files[GIST_DAILY_SPIN_FILENAME].content);
    assert.deepEqual(content, mockSpin);
  });

  await t.test('saveDailySpin throws error on non-ok response', async () => {
    const consoleErrorMock = mock.method(console, 'error', () => {});
    fetchMock.mock.mockImplementationOnce(
      async () => new Response(JSON.stringify({ message: 'Error' }), { status: 500 })
    );

    await assert.rejects(async () => saveDailySpin(mockSpin), /GitHub API responded with 500/);
    consoleErrorMock.mock.restore();
  });

  // --- updateDailySpin ---
  await t.test('updateDailySpin fetches current spin, merges updates, and saves', async () => {
    // Explicitly using mockImplementation to handle multiple calls robustly
    let callCount = 0;
    fetchMock.mock.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return mockGistResponse(JSON.stringify(mockSpin));
      }
      if (callCount === 2) {
        return new Response(JSON.stringify({}), { status: 200 });
      }
      return new Response(null, { status: 500 });
    });

    const updates = { movieTitle: 'Updated Title' };
    const result = await updateDailySpin(updates);

    assert.equal(result.movieTitle, 'Updated Title');
    assert.equal(result.movieId, mockSpin.movieId); // retained

    // Verify save call
    assert.equal(fetchMock.mock.callCount(), 2);
    const saveCall = fetchMock.mock.calls[1];
    const body = JSON.parse(saveCall.arguments[1]?.body as string);
    const content = JSON.parse(body.files[GIST_DAILY_SPIN_FILENAME].content);
    assert.equal(content.movieTitle, 'Updated Title');
  });

  await t.test('updateDailySpin throws if no current spin exists', async () => {
    // Mock getDailySpin response (null)
    fetchMock.mock.mockImplementationOnce(async () => mockGistResponse(null));

    await assert.rejects(
      async () => updateDailySpin({ movieTitle: 'New' }),
      /No daily spin exists to update/
    );
  });

  // --- deleteDailySpin ---
  await t.test('deleteDailySpin sends correct PATCH request on success', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await deleteDailySpin();

    assert.equal(fetchMock.mock.callCount(), 1);
    const call = fetchMock.mock.calls[0];
    assert.equal(call.arguments[0], GIST_API_URL);

    const options = call.arguments[1] as RequestInit;
    assert.equal(options.method, 'PATCH');

    const body = JSON.parse(options.body as string);
    assert.deepEqual(body, {
      files: {
        [GIST_DAILY_SPIN_FILENAME]: {
          content: '',
        },
      },
    });
  });

  await t.test('deleteDailySpin throws and logs error when API response is not ok', async () => {
    const consoleErrorMock = mock.method(console, 'error', () => {});
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
    });

    await assert.rejects(async () => deleteDailySpin(), {
      message: 'GitHub API responded with 500',
    });

    assert.equal(consoleErrorMock.mock.callCount(), 2); // 1 for details, 1 for "Error deleting..."
    consoleErrorMock.mock.restore();
  });

  await t.test('deleteDailySpin throws and logs error when fetch fails', async () => {
    const consoleErrorMock = mock.method(console, 'error', () => {});
    fetchMock.mock.mockImplementationOnce(async () => {
      throw new Error('Network error');
    });

    await assert.rejects(async () => deleteDailySpin(), { message: 'Network error' });

    assert.equal(consoleErrorMock.mock.callCount(), 1);
    consoleErrorMock.mock.restore();
  });

  // --- hasSpunToday ---
  await t.test('hasSpunToday returns true when spin date matches today', async () => {
    fetchMock.mock.mockImplementationOnce(async () => mockGistResponse(JSON.stringify(mockSpin)));
    const result = await hasSpunToday();
    assert.equal(result, true);
  });

  await t.test('hasSpunToday returns false when spin date is different', async () => {
    const oldSpin = { ...mockSpin, date: '2024-03-19' };
    fetchMock.mock.mockImplementationOnce(async () => mockGistResponse(JSON.stringify(oldSpin)));
    const result = await hasSpunToday();
    assert.equal(result, false);
  });

  // --- getTodaySpin ---
  await t.test('getTodaySpin returns spin if date matches today', async () => {
    fetchMock.mock.mockImplementationOnce(async () => mockGistResponse(JSON.stringify(mockSpin)));
    const result = await getTodaySpin();
    assert.deepEqual(result, mockSpin);
  });

  await t.test('getTodaySpin returns null if date does not match today', async () => {
    const oldSpin = { ...mockSpin, date: '2024-03-19' };
    fetchMock.mock.mockImplementationOnce(async () => mockGistResponse(JSON.stringify(oldSpin)));
    const result = await getTodaySpin();
    assert.equal(result, null);
  });

  await t.test('getTodaySpin returns null if no spin exists', async () => {
    fetchMock.mock.mockImplementationOnce(async () => mockGistResponse(null));
    const result = await getTodaySpin();
    assert.equal(result, null);
  });
});
