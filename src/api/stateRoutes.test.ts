import assert from 'node:assert/strict';
import test from 'node:test';

import { invalidateGistCache } from '../../api/_lib/gistStore.ts';
import mutateHandler from '../../api/state/[scope]/mutate.ts';
import readHandler from '../../api/state/[scope].ts';

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
