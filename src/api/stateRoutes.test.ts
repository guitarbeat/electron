import assert from 'node:assert/strict';
import test from 'node:test';

import { getScopeWarning } from '../../api/_lib/state.ts';
import { invalidateGistCache } from '../../api/_lib/gistStore.ts';
import { buildProfileCookie } from '../../api/_lib/session.ts';
import mutateHandler from '../../api/state/[scope]/mutate.ts';
import readHandler from '../../api/state/[scope].ts';
import type { Movie, MovieSuggestion, PlaceSuggestion, SharedMemory } from '../shared/types.ts';

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

const withSuggestionStore = async (
  seedSuggestions: MovieSuggestion[],
  run: (context: { getSuggestions: () => MovieSuggestion[]; patchBodies: unknown[] }) => Promise<void>
) => {
  const previousGistId = process.env.GIST_ID;
  const previousGitHubToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;
  const patchBodies: unknown[] = [];
  let suggestions = [...seedSuggestions];

  process.env.GIST_ID = 'test-gist-id';
  process.env.GITHUB_TOKEN = 'ghp_testToken';
  invalidateGistCache();

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);

    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          files: {
            'suggestions.json': {
              content: JSON.stringify(suggestions),
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

      const nextContent = body.files?.['suggestions.json']?.content;
      if (typeof nextContent === 'string') {
        suggestions = JSON.parse(nextContent) as MovieSuggestion[];
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
      getSuggestions: () => suggestions,
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

const withPlaceSuggestionStore = async (
  seedSuggestions: PlaceSuggestion[],
  run: (context: { getSuggestions: () => PlaceSuggestion[]; patchBodies: unknown[] }) => Promise<void>
) => {
  const previousGistId = process.env.GIST_ID;
  const previousGitHubToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;
  const patchBodies: unknown[] = [];
  let suggestions = [...seedSuggestions];

  process.env.GIST_ID = 'test-gist-id';
  process.env.GITHUB_TOKEN = 'ghp_testToken';
  invalidateGistCache();

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);

    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          files: {
            'placesuggestions.json': {
              content: JSON.stringify(suggestions),
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

      const nextContent = body.files?.['placesuggestions.json']?.content;
      if (typeof nextContent === 'string') {
        suggestions = JSON.parse(nextContent) as PlaceSuggestion[];
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
      getSuggestions: () => suggestions,
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

const withMemoryStore = async (
  seedMemories: SharedMemory[],
  run: (context: { getMemories: () => SharedMemory[]; patchBodies: unknown[] }) => Promise<void>
) => {
  const previousGistId = process.env.GIST_ID;
  const previousGitHubToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;
  const patchBodies: unknown[] = [];
  let memories = [...seedMemories];

  process.env.GIST_ID = 'test-gist-id';
  process.env.GITHUB_TOKEN = 'ghp_testToken';
  invalidateGistCache();

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);

    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          files: {
            'memories.json': {
              content: JSON.stringify(memories),
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

      const nextContent = body.files?.['memories.json']?.content;
      if (typeof nextContent === 'string') {
        memories = JSON.parse(nextContent) as SharedMemory[];
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
      getMemories: () => memories,
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

test('dynamic state read route falls back to default state when GIST_ID is missing', async () => {
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
      assert.match(payload.warning ?? '', /missing GIST_ID|VITE_GIST_ID/i);
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

test('dynamic state mutate route lets guests create movie suggestions', async () => {
  await withSuggestionStore([], async ({ getSuggestions, patchBodies }) => {
    const readResponse = await readHandler(new Request('https://example.com/api/state/suggestions'));
    assert.equal(readResponse.status, 200);

    const readPayload = (await readResponse.json()) as {
      version: string;
    };

    const response = await mutateHandler(
      new Request('https://example.com/api/state/suggestions/mutate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseVersion: readPayload.version,
          op: 'add_suggestion',
          payload: {
            id: 'suggestion-1',
            title: 'The Nice Guys',
            reason: 'Sharp, funny, and easy to throw on.',
            suggestedBy: 'Movie Night Guest',
            imdbID: 'tt3799694',
            type: 'movie',
          },
        }),
      })
    );

    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      data: MovieSuggestion[];
      applied: boolean;
    };

    assert.equal(payload.applied, true);
    assert.equal(payload.data[0]?.title, 'The Nice Guys');
    assert.equal(payload.data[0]?.suggestedBy, 'Movie Night Guest');
    assert.equal(payload.data[0]?.imdbID, 'tt3799694');
    assert.equal(payload.data[0]?.type, 'movie');
    assert.equal(getSuggestions()[0]?.suggestedBy, 'Movie Night Guest');
    assert.equal(getSuggestions()[0]?.imdbID, 'tt3799694');
    assert.equal(getSuggestions()[0]?.type, 'movie');
    assert.equal(patchBodies.length, 1);
  });
});

test('dynamic state mutate route lets guests create place suggestions', async () => {
  await withPlaceSuggestionStore([], async ({ getSuggestions, patchBodies }) => {
    const readResponse = await readHandler(new Request('https://example.com/api/state/placeSuggestions'));
    assert.equal(readResponse.status, 200);

    const readPayload = (await readResponse.json()) as {
      version: string;
    };

    const response = await mutateHandler(
      new Request('https://example.com/api/state/placeSuggestions/mutate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseVersion: readPayload.version,
          op: 'add_place_suggestion',
          payload: {
            id: 'place-suggestion-1',
            name: 'Skylight Lounge',
            notes: 'Rooftop patio and late-night tacos.',
            category: 'Restaurant',
            suggestedBy: 'Patio Scout',
          },
        }),
      })
    );

    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      data: PlaceSuggestion[];
      applied: boolean;
    };

    assert.equal(payload.applied, true);
    assert.equal(payload.data[0]?.name, 'Skylight Lounge');
    assert.equal(payload.data[0]?.notes, 'Rooftop patio and late-night tacos.');
    assert.equal(payload.data[0]?.category, 'Restaurant');
    assert.equal(payload.data[0]?.suggestedBy, 'Patio Scout');
    assert.equal(getSuggestions()[0]?.suggestedBy, 'Patio Scout');
    assert.equal(patchBodies.length, 1);
  });
});

test('dynamic state mutate route keeps selection metadata for signed-in suggestions', async () => {
  await withSuggestionStore([], async ({ getSuggestions, patchBodies }) => {
    const cookie = buildProfileCookie(
      new Request('https://example.com/api/session/profile'),
      'Aaron'
    );

    const readResponse = await readHandler(
      new Request('https://example.com/api/state/suggestions', {
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
      new Request('https://example.com/api/state/suggestions/mutate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie,
        },
        body: JSON.stringify({
          baseVersion: readPayload.version,
          op: 'add_suggestion',
          payload: {
            id: 'suggestion-2',
            title: 'The Bear',
            reason: 'Series pick',
            imdbID: 'tv-11',
            type: 'series',
          },
        }),
      })
    );

    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      data: MovieSuggestion[];
      applied: boolean;
    };

    assert.equal(payload.applied, true);
    assert.equal(payload.data[0]?.suggestedBy, 'Aaron');
    assert.equal(payload.data[0]?.imdbID, 'tv-11');
    assert.equal(payload.data[0]?.type, 'series');
    assert.equal(getSuggestions()[0]?.imdbID, 'tv-11');
    assert.equal(getSuggestions()[0]?.type, 'series');
    assert.equal(patchBodies.length, 1);
  });
});

test('dynamic state mutate route rejects editing another user memory', async () => {
  await withMemoryStore(
    [
      {
        id: 'memory-1',
        movieId: 'movie-1',
        movieTitle: 'Moonlight',
        author: 'Aaron',
        note: 'Original note',
        createdAt: new Date('2026-03-27T12:00:00.000Z').toISOString(),
      },
    ],
    async ({ getMemories, patchBodies }) => {
      const cookie = buildProfileCookie(
        new Request('https://example.com/api/session/profile'),
        'Electra'
      );

      const readResponse = await readHandler(
        new Request('https://example.com/api/state/memories', {
          headers: {
            cookie,
          },
        })
      );
      assert.equal(readResponse.status, 200);

      const readPayload = (await readResponse.json()) as { version: string };

      const response = await mutateHandler(
        new Request('https://example.com/api/state/memories/mutate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie,
          },
          body: JSON.stringify({
            baseVersion: readPayload.version,
            op: 'update_memory',
            payload: {
              memoryId: 'memory-1',
              updates: {
                note: 'Rewritten by someone else',
              },
            },
          }),
        })
      );

      assert.equal(response.status, 409);
      const payload = (await response.json()) as { conflict: string };
      assert.match(payload.conflict, /only the author can edit/i);
      assert.equal(getMemories()[0]?.note, 'Original note');
      assert.equal(patchBodies.length, 0);
    }
  );
});

test('dynamic state mutate route rejects deleting another user memory', async () => {
  await withMemoryStore(
    [
      {
        id: 'memory-1',
        movieId: 'movie-1',
        movieTitle: 'Moonlight',
        author: 'Aaron',
        note: 'Original note',
        createdAt: new Date('2026-03-27T12:00:00.000Z').toISOString(),
      },
    ],
    async ({ getMemories, patchBodies }) => {
      const cookie = buildProfileCookie(
        new Request('https://example.com/api/session/profile'),
        'Electra'
      );

      const readResponse = await readHandler(
        new Request('https://example.com/api/state/memories', {
          headers: {
            cookie,
          },
        })
      );
      assert.equal(readResponse.status, 200);

      const readPayload = (await readResponse.json()) as { version: string };

      const response = await mutateHandler(
        new Request('https://example.com/api/state/memories/mutate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie,
          },
          body: JSON.stringify({
            baseVersion: readPayload.version,
            op: 'delete_memory',
            payload: {
              memoryId: 'memory-1',
            },
          }),
        })
      );

      assert.equal(response.status, 409);
      const payload = (await response.json()) as { conflict: string };
      assert.match(payload.conflict, /only the author can delete/i);
      assert.equal(getMemories().length, 1);
      assert.equal(patchBodies.length, 0);
    }
  );
});
