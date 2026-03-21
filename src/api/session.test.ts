import assert from 'node:assert/strict';
import test from 'node:test';

import accessHandler from '../../api/session/access.ts';
import sessionHandler from '../../api/session.ts';

test('access endpoint no longer requires an app secret', async () => {
  const response = await accessHandler(
    new Request('https://example.com/api/session/access', {
      method: 'POST',
    })
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { hasAccess: true });
});

test('session endpoint always reports app access even without a profile cookie', async () => {
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
