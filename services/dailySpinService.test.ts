import assert from 'node:assert/strict';
import { mock, test, after, beforeEach } from 'node:test';
import { hasSpunToday } from './dailySpinService.ts';

// A fixed Wednesday for testing
const MOCK_DATE = new Date('2024-03-20T12:00:00Z');

test('dailySpinService', async (t) => {
  // Mock Date using mock.timers to freeze time
  t.mock.timers.enable({ apis: ['Date'], now: MOCK_DATE });

  // Mock global.fetch
  const fetchMock = mock.method(global, 'fetch');

  // Restore fetch after all tests in this suite
  after(() => {
    fetchMock.mock.restore();
  });

  // Clear mock history before each test
  beforeEach(() => {
    fetchMock.mock.resetCalls();
  });

  await t.test('hasSpunToday returns true when spin date matches today', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {
            'dailyspin.json': {
              content: JSON.stringify({ date: '2024-03-20', result: 'Test Result' }),
            },
          },
        }),
        { status: 200 }
      );
    });

    const result = await hasSpunToday();
    assert.equal(result, true);
  });

  await t.test('hasSpunToday returns false when spin date is different', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {
            'dailyspin.json': {
              content: JSON.stringify({ date: '2024-03-19', result: 'Old Result' }),
            },
          },
        }),
        { status: 200 }
      );
    });

    const result = await hasSpunToday();
    assert.equal(result, false);
  });

  await t.test('hasSpunToday returns false when spin file does not exist', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {}, // Empty files
        }),
        { status: 200 }
      );
    });

    const result = await hasSpunToday();
    assert.equal(result, false);
  });

  await t.test('hasSpunToday returns false when fetch fails', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      // Simulate fetch error by returning non-ok response
      return new Response(null, { status: 500, statusText: 'Server Error' });
    });

    const result = await hasSpunToday();
    assert.equal(result, false);
  });

  await t.test('hasSpunToday returns false when fetch throws network error', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      throw new Error('Network error');
    });

    const result = await hasSpunToday();
    assert.equal(result, false);
  });
});
