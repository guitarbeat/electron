import assert from 'node:assert/strict';
import test from 'node:test';

import { invalidateGistCache } from '../../api/_lib/gistStore.ts';
import { hashPin } from '../../api/_lib/session.ts';
import profileHandler, {
  computeNextPinAttemptState,
  profilePinRateLimitConfig,
} from '../../api/session/profile.ts';
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

const withPinsStore = async (
  pins: Record<string, string>,
  run: () => Promise<void>
) => {
  const previousGistId = process.env.GIST_ID;
  const previousGitHubToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;

  process.env.GIST_ID = 'test-gist-id';
  process.env.GITHUB_TOKEN = 'ghp_testToken';
  invalidateGistCache();

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        files: {
          'pins.json': {
            content: JSON.stringify(pins),
          },
        },
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

    if (typeof previousGitHubToken === 'string') {
      process.env.GITHUB_TOKEN = previousGitHubToken;
    } else {
      delete process.env.GITHUB_TOKEN;
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
        usersMissingPins: [],
      });
    } finally {
      console.warn = originalWarn;
    }
  });
});

test('profile endpoint allows selecting an unprotected user when the shared pin store is missing', async () => {
  await withUnsetGistId(async () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      const response = await profileHandler(
        new Request('https://example.com/api/session/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user: 'Aaron' }),
        })
      );

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        hasAccess: true,
        currentUser: 'Aaron',
        pinProtectedUsers: [],
        usersMissingPins: [],
      });
    } finally {
      console.warn = originalWarn;
    }
  });
});

test('profile endpoint still requires a PIN for protected users', async () => {
  await withPinsStore(
    {
      Aaron: hashPin('1234'),
    },
    async () => {
      const missingPinResponse = await profileHandler(
        new Request('https://example.com/api/session/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user: 'Aaron' }),
        })
      );

      assert.equal(missingPinResponse.status, 401);
      assert.match(await missingPinResponse.text(), /Incorrect PIN/i);

      const validPinResponse = await profileHandler(
        new Request('https://example.com/api/session/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user: 'Aaron', pin: '1234' }),
        })
      );

      assert.equal(validPinResponse.status, 200);
      assert.deepEqual(await validPinResponse.json(), {
        hasAccess: true,
        currentUser: 'Aaron',
        pinProtectedUsers: ['Aaron'],
        usersMissingPins: ['Electra'],
      });
    }
  );
});

test('session endpoint reports both users as missing PINs when pins.json is empty', async () => {
  await withPinsStore({}, async () => {
    const response = await sessionHandler(new Request('https://example.com/api/session'));

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      hasAccess: true,
      currentUser: null,
      pinProtectedUsers: [],
      usersMissingPins: ['Aaron', 'Electra'],
    });
  });
});

test('PIN lockout state only starts after configured max failures', () => {
  const now = Date.now();
  let failures = 0;

  for (let attempt = 1; attempt < profilePinRateLimitConfig.maxAttempts; attempt += 1) {
    const next = computeNextPinAttemptState(failures, now);
    assert.equal(next.failures, attempt);
    assert.equal(next.lockedUntil, null);
    failures = next.failures;
  }
});

test('PIN lockout state sets lock duration at max failures', () => {
  const now = Date.now();
  const next = computeNextPinAttemptState(profilePinRateLimitConfig.maxAttempts - 1, now);

  assert.equal(next.failures, profilePinRateLimitConfig.maxAttempts);
  assert.equal(next.lockedUntil, now + profilePinRateLimitConfig.lockoutMs);
});
