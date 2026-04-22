import assert from 'node:assert/strict';
import test from 'node:test';

import { invalidateGistCache } from '../../api/_lib/gistStore.ts';
import sessionHandler from '../../api/session.ts';
import readHandler from '../../api/state/[scope].ts';

const withMockGistFiles = async (
  initialFiles: Record<string, { content?: string }>,
  run: (context: {
    patchBodies: Array<{ files?: Record<string, { content?: string } | undefined> }>;
    getFiles: () => Record<string, { content?: string }>;
  }) => Promise<void>
) => {
  const previousGistId = process.env.GIST_ID;
  const previousGitHubToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;
  const patchBodies: Array<{ files?: Record<string, { content?: string } | undefined> }> = [];
  let files = { ...initialFiles };

  process.env.GIST_ID = 'test-gist-id';
  process.env.GITHUB_TOKEN = 'ghp_testToken';
  invalidateGistCache();

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);

    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({ files }),
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

      for (const [filename, nextFile] of Object.entries(body.files ?? {})) {
        files = {
          ...files,
          [filename]: {
            content: nextFile?.content ?? '',
          },
        };
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
      patchBodies,
      getFiles: () => files,
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

test('reading a missing placeSuggestions scope bootstraps the default Gist file once', async () => {
  await withMockGistFiles(
    {
      'movielist.json': { content: '[]' },
    },
    async ({ patchBodies, getFiles }) => {
      const response = await readHandler(
        new Request('https://example.com/api/state/placeSuggestions')
      );

      assert.equal(response.status, 200);

      const payload = (await response.json()) as {
        data: unknown[];
        degraded: boolean;
      };

      assert.deepEqual(payload.data, []);
      assert.equal(payload.degraded, false);
      assert.equal(patchBodies.length, 1);
      assert.equal(getFiles()['placesuggestions.json']?.content, '[]');
    }
  );
});

test('reading an existing placeSuggestions scope does not rewrite the Gist', async () => {
  await withMockGistFiles(
    {
      'placesuggestions.json': { content: '[]' },
    },
    async ({ patchBodies }) => {
      const response = await readHandler(
        new Request('https://example.com/api/state/placeSuggestions')
      );

      assert.equal(response.status, 200);
      assert.equal(patchBodies.length, 0);
    }
  );
});

test('missing pins.json reports both users as missing PINs and bootstraps the file', async () => {
  await withMockGistFiles(
    {
      'movielist.json': { content: '[]' },
    },
    async ({ patchBodies, getFiles }) => {
      const response = await sessionHandler(new Request('https://example.com/api/session'));

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        hasAccess: true,
        currentUser: null,
        pinProtectedUsers: [],
        usersMissingPins: ['Aaron', 'Electra'],
      });
      assert.equal(patchBodies.length, 1);
      assert.equal(getFiles()['pins.json']?.content, '{}');
    }
  );
});
