import assert from 'node:assert/strict';
import { mock, test, after, beforeEach } from 'node:test';
import { getMatchmakerGame, saveMatchmakerGame } from './matchmakerService.ts';
import { GIST_MATCHMAKER_FILENAME, GIST_API_URL } from '../config/gistConfig.ts';
import type { MatchmakerGame } from '../types.ts';

const MOCK_GAME: MatchmakerGame = {
  id: 'game-123',
  moviePool: ['movie-1', 'movie-2'],
  aaronLikes: ['movie-1'],
  electraLikes: ['movie-2'],
  aaronDislikes: [],
  electraDislikes: [],
  status: 'active',
  createdAt: '2024-03-20T12:00:00Z',
  startedBy: 'Aaron',
};

test('matchmakerService', async (t) => {
  const fetchMock = mock.method(global, 'fetch');

  after(() => {
    fetchMock.mock.restore();
  });

  beforeEach(() => {
    fetchMock.mock.resetCalls();
  });

  await t.test('getMatchmakerGame returns game when file exists and is valid', async () => {
    fetchMock.mock.mockImplementationOnce(async (url) => {
      assert.equal(url, GIST_API_URL);
      return new Response(
        JSON.stringify({
          files: {
            [GIST_MATCHMAKER_FILENAME]: {
              content: JSON.stringify(MOCK_GAME),
            },
          },
        }),
        { status: 200 }
      );
    });

    const game = await getMatchmakerGame();
    assert.deepEqual(game, MOCK_GAME);
  });

  await t.test('getMatchmakerGame returns null when file content is empty', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {
            [GIST_MATCHMAKER_FILENAME]: {
              content: '',
            },
          },
        }),
        { status: 200 }
      );
    });

    const game = await getMatchmakerGame();
    assert.equal(game, null);
  });

  await t.test('getMatchmakerGame returns null when file is missing', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {},
        }),
        { status: 200 }
      );
    });

    const game = await getMatchmakerGame();
    assert.equal(game, null);
  });

  await t.test('getMatchmakerGame returns null on JSON parse error', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          files: {
            [GIST_MATCHMAKER_FILENAME]: {
              content: '{ invalid json }',
            },
          },
        }),
        { status: 200 }
      );
    });

    const game = await getMatchmakerGame();
    assert.equal(game, null);
  });

  await t.test('getMatchmakerGame returns null on fetch error', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(null, { status: 500 });
    });

    const game = await getMatchmakerGame();
    assert.equal(game, null);
  });

  await t.test('saveMatchmakerGame sends correct data', async () => {
    fetchMock.mock.mockImplementationOnce(async (url, options) => {
      assert.equal(url, GIST_API_URL);
      assert.equal(options!.method, 'PATCH');

      const body = JSON.parse(options!.body as string);
      const content = JSON.parse(body.files[GIST_MATCHMAKER_FILENAME].content);

      assert.deepEqual(content, MOCK_GAME);

      return new Response(JSON.stringify({}), { status: 200 });
    });

    await saveMatchmakerGame(MOCK_GAME);
    assert.equal(fetchMock.mock.callCount(), 1);
  });

  await t.test('saveMatchmakerGame clears game when passed null', async () => {
    fetchMock.mock.mockImplementationOnce(async (url, options) => {
      const body = JSON.parse(options!.body as string);
      assert.equal(body.files[GIST_MATCHMAKER_FILENAME].content, '');
      return new Response(JSON.stringify({}), { status: 200 });
    });

    await saveMatchmakerGame(null);
    assert.equal(fetchMock.mock.callCount(), 1);
  });

  await t.test('saveMatchmakerGame throws on fetch error', async () => {
    fetchMock.mock.mockImplementationOnce(async () => {
      return new Response(JSON.stringify({ message: 'Error' }), { status: 500 });
    });

    await assert.rejects(async () => {
      await saveMatchmakerGame(MOCK_GAME);
    }, /GitHub API responded with 500/);
  });
});
