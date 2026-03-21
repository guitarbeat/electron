import assert from 'node:assert/strict';
import test from 'node:test';

import { invalidateGistCache, readGistFile } from '../../api/_lib/gistStore.ts';

const GIST_ID = 'ba250f944e3e9e71c0d669060254eab2';

const withGistEnv = async (
  env: {
    GIST_ID?: string;
    VITE_GIST_ID?: string;
  },
  run: () => Promise<void>
) => {
  const previousGistId = process.env.GIST_ID;
  const previousViteGistId = process.env.VITE_GIST_ID;

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
