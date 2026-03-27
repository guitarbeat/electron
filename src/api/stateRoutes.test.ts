import assert from 'node:assert/strict';
import test from 'node:test';

import { getScopeWarning } from '../../api/_lib/state.ts';
import { invalidateGistCache } from '../../api/_lib/gistStore.ts';
import { buildProfileCookie } from '../../api/_lib/session.ts';
import mutateHandler from '../../api/state/[scope]/mutate.ts';
import readHandler from '../../api/state/[scope].ts';
import type { Movie } from '../shared/types.ts';

const withUnsetGistId = async (run: () => Promise<void>) => {
  const previousGistId = process.env.GIST_ID;
  delete process.env.GIST_ID;
  invalidateGistCache();

  try {
    await run();
  } finally {
    if (typeof previousGistId === 'string') {
      process.env.GIST_ID = previousGistId;
    } else {
      delete process.env.GIST_ID;
    }
    invalidateGistCache();
  }
};

const withMovieStore = async (
  seedMovies: Movie[],
  run: (context: { getMovies: () => Movie[]; patchBodies: unknown[] }) => Promise<void>
) => {
  const previousGistId = process.env.GIST_ID;
  const previousGitHubToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;
  const patchBodies: unknown[] = [];
  let movies = [...seedMovies];

  process.env.GIST_ID = 'test-gist-id';
  process.env.GITHUB_TOKEN = 'ghp_testToken';
  invalidateGistCache();

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);

    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          files: {
            'movielist.json': {
              content: JSON.stringify(movies),
            },
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (request.method === 'PATCH') {
      const body = JSON.parse(await request.text()) as {
        files?: Record<string, { content?: string } | undefined>;
      };
      patchBodies.push(body);

      const nextContent = body.files?.['movielist.json']?.content;
      if (typeof nextContent === 'string') {
        movies = JSON.parse(nextContent) as Movie[];
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported method' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }) as typeof fetch;

  try {
    await run({
      getMovies: () => movies,
      patchBodies,
    });
  } finally {
    globalThis.fetch = originalFetch;

    if (typeof previousGistId === 'string') {
      process.env.GIST_ID = previousGistId;
    } else {
      delete process.env.GIST_ID;
    }

    if (typeof previousGitHubToken === 'string') {
      process.env.GITHUB_TOKEN = previousGitHubToken;
    } else {
      delete process.env.GITHUB_TOKEN;
    }

    invalidateGistCache();
  }
};

test('dynamic state read route returns 404 for unknown scopes', async () => {
  const response = await readHandler(new Request('https://example.com/api/state/nope'));

  assert.equal(response.status, 404);
  assert.match(await response.text(), /not found/i);
});

test('dynamic state mutate route returns 404 for unknown scopes', async () => {
  const response = await mutateHandler(
    new Request('https://example.com/api/state/nope/mutate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
  );

  assert.equal(response.status, 404);
  assert.match(await response.text(), /not found/i);
});

test('getScopeWarning maps gist and config errors to user-safe copy', () => {
  assert.ok(
    (getScopeWarning(new Error('GIST_ID is not configured.')) ?? '').includes('VITE_GIST_ID')
  );
  assert.ok((getScopeWarning(new Error('Failed to read gist (404).')) ?? '').includes('cannot find'));
  assert.ok((getScopeWarning(new Error('Failed to read gist (403).')) ?? '').includes('401/403'));
  assert.ok((getScopeWarning(new Error('Failed to read gist (429).')) ?? '').includes('rate limit'));
  assert.ok((getScopeWarning(new Error('Failed to update gist (500).')) ?? '').includes('500'));
  assert.ok((getScopeWarning(new Error('unexpected')) ?? '').includes('could not be loaded'));
  assert.equal(getScopeWarning(null), undefined);
});

test('dynamic state read route returns a clear warning when GIST_ID is missing', async () => {
  await withUnsetGistId(async () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      const response = await readHandler(new Request('https://example.com/api/state/movies'));
      const payload = (await response.json()) as {
        degraded: boolean;
        warning?: string;
      };

      assert.equal(response.status, 200);
      assert.equal(payload.degraded, true);
      assert.match(payload.warning || '', /missing GIST_ID/i);
    } finally {
      console.warn = originalWarn;
    }
  });
});

test('dynamic state mutate route renames a movie when a profile session is present', async () => {
  await withMovieStore(
    [
      {
        id: 'movie-1',
        title: 'Before',
        addedBy: 'Aaron',
        watchedBy: [],
        createdAt: new Date('2026-03-27T12:00:00.000Z').toISOString(),
      },
    ],
    async ({ getMovies, patchBodies }) => {
      const cookie = buildProfileCookie(
        new Request('https://example.com/api/session/profile'),
        'Aaron'
      );

      const readResponse = await readHandler(
        new Request('https://example.com/api/state/movies', {
          headers: {
            cookie,
          },
        })
      );

      assert.equal(readResponse.status, 200);

      const readPayload = (await readResponse.json()) as {
        version: string;
      };

      const response = await mutateHandler(
        new Request('https://example.com/api/state/movies/mutate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie,
          },
          body: JSON.stringify({
            baseVersion: readPayload.version,
            op: 'rename_movie',
            payload: {
              movieId: 'movie-1',
              title: 'After Hours',
            },
          }),
        })
      );

      assert.equal(response.status, 200);

      const payload = (await response.json()) as {
        data: Movie[];
        applied: boolean;
      };

      assert.equal(payload.applied, true);
      assert.equal(payload.data[0]?.title, 'After Hours');
      assert.equal(getMovies()[0]?.title, 'After Hours');
      assert.equal(patchBodies.length, 1);
    }
  );
});
