import assert from 'node:assert/strict';
import test from 'node:test';

import { invalidateGistCache } from '../../api/_lib/gistStore.ts';
import profileHandler from '../../api/session/profile.ts';
import sessionHandler from '../../api/session.ts';

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

test('session endpoint always reports app access even without a profile cookie', async () => {
  await withUnsetGistId(async () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      const response = await sessionHandler(new Request('https://example.com/api/session'));

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        hasAccess: true,
        currentUser: null,
        pinProtectedUsers: [],
      });
    } finally {
      console.warn = originalWarn;
    }
  });
});

test('profile endpoint explains when the shared pin store is missing', async () => {
  await withUnsetGistId(async () => {
    const response = await profileHandler(
      new Request('https://example.com/api/session/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: 'Aaron' }),
      })
    );

    assert.equal(response.status, 500);
    assert.match(
      await response.text(),
      /shared pin store is not configured.*GIST_ID/i
    );
  });
});
