import assert from 'node:assert/strict';
import test from 'node:test';

import { invalidateGistCache, readGistFile } from '../../api/_lib/gistStore.ts';

const GIST_ID = 'ba250f944e3e9e71c0d669060254eab2';

const withGistEnv = async (
  env: {
    GIST_ID?: string;
    VITE_GIST_ID?: string;
    GITHUB_TOKEN?: string;
    GITHUB_PERSONAL_ACCESS_TOKEN?: string;
    GH_TOKEN?: string;
  },
  run: () => Promise<void>
) => {
  const previousGistId = process.env.GIST_ID;
  const previousViteGistId = process.env.VITE_GIST_ID;
  const previousGitHubToken = process.env.GITHUB_TOKEN;
  const previousGitHubPersonalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const previousGhToken = process.env.GH_TOKEN;

  if (typeof env.GIST_ID === 'string') {
    process.env.GIST_ID = env.GIST_ID;
  } else {
    delete process.env.GIST_ID;
  }

  if (typeof env.VITE_GIST_ID === 'string') {
    process.env.VITE_GIST_ID = env.VITE_GIST_ID;
  } else {
    delete process.env.VITE_GIST_ID;
  }

  if (typeof env.GITHUB_TOKEN === 'string') {
    process.env.GITHUB_TOKEN = env.GITHUB_TOKEN;
  } else {
    delete process.env.GITHUB_TOKEN;
  }

  if (typeof env.GITHUB_PERSONAL_ACCESS_TOKEN === 'string') {
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN = env.GITHUB_PERSONAL_ACCESS_TOKEN;
  } else {
    delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  }

  if (typeof env.GH_TOKEN === 'string') {
    process.env.GH_TOKEN = env.GH_TOKEN;
  } else {
    delete process.env.GH_TOKEN;
  }

  invalidateGistCache();

  try {
    await run();
  } finally {
    if (typeof previousGistId === 'string') {
      process.env.GIST_ID = previousGistId;
    } else {
      delete process.env.GIST_ID;
    }

    if (typeof previousViteGistId === 'string') {
      process.env.VITE_GIST_ID = previousViteGistId;
    } else {
      delete process.env.VITE_GIST_ID;
    }

    if (typeof previousGitHubToken === 'string') {
      process.env.GITHUB_TOKEN = previousGitHubToken;
    } else {
      delete process.env.GITHUB_TOKEN;
    }

    if (typeof previousGitHubPersonalAccessToken === 'string') {
      process.env.GITHUB_PERSONAL_ACCESS_TOKEN = previousGitHubPersonalAccessToken;
    } else {
      delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    }

    if (typeof previousGhToken === 'string') {
      process.env.GH_TOKEN = previousGhToken;
    } else {
      delete process.env.GH_TOKEN;
    }

    invalidateGistCache();
  }
};

const withMockFetch = async (
  run: (calls: string[]) => Promise<void>
) => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(
      JSON.stringify({
        files: {
          'movielist.json': {
            content: '[]',
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
  }) as typeof fetch;

  try {
    await run(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
};

test('readGistFile strips nested quotes from GIST_ID before calling GitHub', async () => {
  await withGistEnv(
    {
      GIST_ID: `""${GIST_ID}""`,
    },
    async () => {
      await withMockFetch(async (calls) => {
        const content = await readGistFile('movielist.json');

        assert.equal(content, '[]');
        assert.deepEqual(calls, [`https://api.github.com/gists/${GIST_ID}`]);
      });
    }
  );
});

test('readGistFile falls back to VITE_GIST_ID and accepts full gist URLs', async () => {
  await withGistEnv(
    {
      VITE_GIST_ID: `https://gist.github.com/guitarbeat/${GIST_ID}`,
    },
    async () => {
      await withMockFetch(async (calls) => {
        const content = await readGistFile('movielist.json');

        assert.equal(content, '[]');
        assert.deepEqual(calls, [`https://api.github.com/gists/${GIST_ID}`]);
      });
    }
  );
});

test('readGistFile retries without auth when GitHub rejects the token', async () => {
  await withGistEnv(
    {
      GIST_ID,
      GITHUB_TOKEN: 'ghp_expiredTokenValue',
    },
    async () => {
      const originalFetch = globalThis.fetch;
      const calls: Array<{ url: string; auth: string | null }> = [];

      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        calls.push({
          url: String(input),
          auth: headers.get('Authorization'),
        });

        if (calls.length === 1) {
          return new Response(JSON.stringify({ message: 'Bad credentials' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        return new Response(
          JSON.stringify({
            files: {
              'movielist.json': {
                content: '[]',
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
      }) as typeof fetch;

      try {
        const content = await readGistFile('movielist.json');

        assert.equal(content, '[]');
        assert.deepEqual(calls, [
          {
            url: `https://api.github.com/gists/${GIST_ID}`,
            auth: 'Bearer ghp_expiredTokenValue',
          },
          {
            url: `https://api.github.com/gists/${GIST_ID}`,
            auth: null,
          },
        ]);
      } finally {
        globalThis.fetch = originalFetch;
      }
    }
  );
});

test('readGistFile uses GH_TOKEN when other token env vars are unset', async () => {
  await withGistEnv(
    {
      GIST_ID,
      GH_TOKEN: 'ghp_tokenFromGhEnv',
    },
    async () => {
      const originalFetch = globalThis.fetch;
      const calls: Array<{ url: string; auth: string | null }> = [];

      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        calls.push({
          url: String(input),
          auth: headers.get('Authorization'),
        });

        return new Response(
          JSON.stringify({
            files: {
              'movielist.json': {
                content: '[]',
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
      }) as typeof fetch;

      try {
        const content = await readGistFile('movielist.json');

        assert.equal(content, '[]');
        assert.deepEqual(calls, [
          {
            url: `https://api.github.com/gists/${GIST_ID}`,
            auth: 'Bearer ghp_tokenFromGhEnv',
          },
        ]);
      } finally {
        globalThis.fetch = originalFetch;
      }
    }
  );
});

test('readGistFile preserves auth rejection details when anonymous retry also fails', async () => {
  await withGistEnv(
    {
      GIST_ID,
      GITHUB_TOKEN: 'ghp_invalidToken',
    },
    async () => {
      const originalFetch = globalThis.fetch;

      globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        const auth = headers.get('Authorization');

        if (auth) {
          return new Response(JSON.stringify({ message: 'Bad credentials' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        return new Response(JSON.stringify({ message: 'Not Found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }) as typeof fetch;

      try {
        await assert.rejects(
          () => readGistFile('movielist.json'),
          /Failed to read gist \(auth rejected: 401; anonymous retry: 404\)\./
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    }
  );
});
