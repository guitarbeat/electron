import assert from 'node:assert/strict';
import { mock, test, after, beforeEach } from 'node:test';
import { hasSpunToday, getTodayRecord } from './dailySpinService.ts';

// A fixed Wednesday for testing
const MOCK_DATE = new Date('2024-03-20T12:00:00Z');

// ---------------------------------------------------------------------------
// Backwards-compat shim: hasSpunToday
// ---------------------------------------------------------------------------
test('dailySpinService – hasSpunToday (legacy shim)', async (t) => {
  // Mock Date using mock.timers to freeze time
  t.mock.timers.enable({ apis: ['Date'], now: MOCK_DATE });

  // Mock global.fetch
  const fetchMock = mock.method(global, 'fetch');

  after(() => {
    fetchMock.mock.restore();
  });

  beforeEach(() => {
    fetchMock.mock.resetCalls();
  });

  await t.test('returns true when spin date matches today (new array format)', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {
            'dailyspin.json': {
              content: JSON.stringify({
                date: '2024-03-20',
                spins: [
                  {
                    movieId: 'abc',
                    movieTitle: 'Test Movie',
                    spunBy: 'Aaron',
                    createdAt: '2024-03-20T12:00:00.000Z',
                  },
                ],
              }),
            },
          },
        }),
        { status: 200 }
      );
    });

    const result = await hasSpunToday();
    assert.equal(result, true);
  });

  await t.test(
    'returns true when spin date matches today (legacy single-spin format)',
    async () => {
      fetchMock.mock.mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            files: {
              'dailyspin.json': {
                content: JSON.stringify({
                  date: '2024-03-20',
                  movieId: 'abc',
                  movieTitle: 'Test Movie',
                  spunBy: 'Aaron',
                  createdAt: '2024-03-20T12:00:00.000Z',
                }),
              },
            },
          }),
          { status: 200 }
        );
      });

      const result = await hasSpunToday();
      assert.equal(result, true);
    }
  );

  await t.test('returns false when spin date is different', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {
            'dailyspin.json': {
              content: JSON.stringify({
                date: '2024-03-19',
                spins: [
                  {
                    movieId: 'abc',
                    movieTitle: 'Old Movie',
                    spunBy: 'Aaron',
                    createdAt: '2024-03-19T10:00:00.000Z',
                  },
                ],
              }),
            },
          },
        }),
        { status: 200 }
      );
    });

    const result = await hasSpunToday();
    assert.equal(result, false);
  });

  await t.test('returns false when spin file does not exist', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(JSON.stringify({ files: {} }), { status: 200 });
    });

    const result = await hasSpunToday();
    assert.equal(result, false);
  });

  await t.test('returns false when fetch fails', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(null, { status: 500, statusText: 'Server Error' });
    });

    const result = await hasSpunToday();
    assert.equal(result, false);
  });

  await t.test('returns false when fetch throws network error', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      throw new Error('Network error');
    });

    const result = await hasSpunToday();
    assert.equal(result, false);
  });
});

// ---------------------------------------------------------------------------
// New API: getTodayRecord
// ---------------------------------------------------------------------------
test('dailySpinService – getTodayRecord', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: MOCK_DATE });

  const fetchMock = mock.method(global, 'fetch');

  after(() => {
    fetchMock.mock.restore();
  });

  beforeEach(() => {
    fetchMock.mock.resetCalls();
  });

  await t.test('returns a DailySpinRecord with all spins when date matches today', async () => {
    const spins = [
      {
        movieId: 'a1',
        movieTitle: 'Movie A',
        spunBy: 'Aaron',
        createdAt: '2024-03-20T10:00:00.000Z',
      },
      {
        movieId: 'b2',
        movieTitle: 'Movie B',
        spunBy: 'Electra',
        createdAt: '2024-03-20T11:00:00.000Z',
      },
    ];
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {
            'dailyspin.json': {
              content: JSON.stringify({ date: '2024-03-20', spins }),
            },
          },
        }),
        { status: 200 }
      );
    });

    const record = await getTodayRecord();
    assert.ok(record !== null);
    assert.equal(record!.date, '2024-03-20');
    assert.equal(record!.spins.length, 2);
    assert.equal(record!.spins[1].movieTitle, 'Movie B');
  });

  await t.test('migrates legacy single-spin format to DailySpinRecord', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {
            'dailyspin.json': {
              content: JSON.stringify({
                date: '2024-03-20',
                movieId: 'legacy1',
                movieTitle: 'Legacy Movie',
                spunBy: 'Aaron',
                createdAt: '2024-03-20T09:00:00.000Z',
              }),
            },
          },
        }),
        { status: 200 }
      );
    });

    const record = await getTodayRecord();
    assert.ok(record !== null);
    assert.equal(record!.spins.length, 1);
    assert.equal(record!.spins[0].movieId, 'legacy1');
  });

  await t.test('returns null when stored date is from a previous day', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {
            'dailyspin.json': {
              content: JSON.stringify({ date: '2024-03-19', spins: [] }),
            },
          },
        }),
        { status: 200 }
      );
    });

    const record = await getTodayRecord();
    assert.equal(record, null);
  });

  await t.test('returns null when file is absent', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(JSON.stringify({ files: {} }), { status: 200 });
    });

    const record = await getTodayRecord();
    assert.equal(record, null);
  });
});
