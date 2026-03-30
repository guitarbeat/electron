import assert from 'node:assert/strict';
import test from 'node:test';

import { invalidateGistCache } from '../../api/_lib/gistStore.ts';
import handler from '../../api/health.ts';

test('health liveness works when req.url is a relative path', async () => {
  // Vercel runtime can pass a relative `req.url` (e.g. "/api/health"), which must not
  // break `new URL(req.url)`.
  const req = {
    method: 'GET',
    url: '/api/health',
    headers: new Headers(),
  } as unknown as Request;

  const response = await handler(req);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, liveness: true });
});

const withMockGist = async (
  files: Record<string, { content?: string }>,
  run: () => Promise<void>
) => {
  const previousGistId = process.env.GIST_ID;
  const originalFetch = globalThis.fetch;

  process.env.GIST_ID = 'test-gist-id';
  invalidateGistCache();

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        files,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )) as typeof fetch;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    if (typeof previousGistId === 'string') {
      process.env.GIST_ID = previousGistId;
    } else {
      delete process.env.GIST_ID;
    }
    invalidateGistCache();
  }
};

test('deep health reports scope and PIN diagnostics without failing readiness', async () => {
  await withMockGist(
    {
      'movielist.json': { content: '[]' },
      'messages.json': { content: '[]' },
      'memories.json': { content: '[]' },
      'places.json': { content: '[]' },
      'suggestions.json': { content: '[]' },
      'quiz.json': { content: '{}' },
      'matchmaker.json': { content: 'null' },
      'pins.json': { content: '{}' },
      'spinhistory.json': { content: '[]' },
      'dailyspin.json': { content: '' },
    },
    async () => {
      const response = await handler(new Request('https://example.com/api/health?deep=1'));

      assert.equal(response.status, 200);

      const payload = (await response.json()) as {
        ok: boolean;
        readiness: boolean;
        expectedScopes: string[];
        missingScopes: string[];
        pinProtectedUsers: string[];
        usersMissingPins: string[];
        pinCoverageComplete: boolean;
      };

      assert.equal(payload.ok, true);
      assert.equal(payload.readiness, true);
      assert.deepEqual(payload.missingScopes, ['placeSuggestions']);
      assert.deepEqual(payload.pinProtectedUsers, []);
      assert.deepEqual(payload.usersMissingPins, ['Aaron', 'Electra']);
      assert.equal(payload.pinCoverageComplete, false);
      assert.equal(payload.expectedScopes.length, 11);
    }
  );
});
