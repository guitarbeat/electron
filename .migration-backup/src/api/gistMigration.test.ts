import assert from 'node:assert/strict';
import test from 'node:test';

import {
  importSharedStateFileFromGist,
  shouldAttemptGistBackfill,
} from '../../api/_lib/gistMigration.ts';
import { installSharedStateMemoryStoreForTests } from '../../api/_lib/sharedStateStore.ts';

const withGistEnv = async (
  env: Record<string, string | undefined>,
  run: () => Promise<void>
): Promise<void> => {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(env)) {
    previous[key] = process.env[key];
    const next = env[key];
    if (next === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = next;
    }
  }

  try {
    await run();
  } finally {
    for (const key of Object.keys(env)) {
      const next = previous[key];
      if (next === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = next;
      }
    }
  }
};

test('shouldAttemptGistBackfill is true for missing Neon rows and empty bootstrapped arrays', async () => {
  await withGistEnv({ GIST_ID: 'legacy-gist' }, async () => {
    assert.equal(shouldAttemptGistBackfill('movies', false, []), true);
    assert.equal(shouldAttemptGistBackfill('movies', true, []), true);
    assert.equal(shouldAttemptGistBackfill('movies', true, [{ id: 'movie-1' }]), false);
    assert.equal(shouldAttemptGistBackfill('pins', true, {}), true);
  });
});

test('importSharedStateFileFromGist copies gist content when Neon row is missing', async () => {
  const gistPayload = JSON.stringify([
    {
      id: 'movie-legacy',
      title: 'Blade Runner',
      addedBy: 'Aaron',
      watchedBy: [],
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ]);

  await withGistEnv(
    {
      GIST_ID: 'test-gist-id',
      DATABASE_URL: 'postgres://example.test/db',
      GITHUB_TOKEN: 'test-token',
    },
    async () => {
      const neonMock = installSharedStateMemoryStoreForTests({});

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (input) => {
        const url = String(input);
        if (url.includes('api.github.com/gists/test-gist-id')) {
          return new Response(
            JSON.stringify({
              files: {
                'movielist.json': { content: gistPayload },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('not found', { status: 404 });
      };

      try {
        const imported = await importSharedStateFileFromGist('movielist.json');
        assert.equal(imported, true);
        assert.equal(neonMock.getFile('movielist.json'), gistPayload);
      } finally {
        globalThis.fetch = originalFetch;
        neonMock.dispose();
      }
    }
  );
});
