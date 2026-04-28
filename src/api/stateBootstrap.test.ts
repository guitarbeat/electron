import assert from 'node:assert/strict';
import test from 'node:test';

import sessionHandler from '../../api/session.ts';
import readHandler from '../../api/state/[scope].ts';
import { createUpstashMemoryMock } from './test/upstashMock.ts';

test('reading a missing placeSuggestions scope bootstraps the default Redis key once', async () => {
  const mock = createUpstashMemoryMock({
    'movielist.json': '[]',
  });

  try {
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
    assert.equal(mock.patchBodies.length, 1);
    assert.equal(mock.getFile('placesuggestions.json'), '[]');
  } finally {
    mock.dispose();
  }
});

test('reading an existing placeSuggestions scope does not rewrite Redis', async () => {
  const mock = createUpstashMemoryMock({
    'placesuggestions.json': '[]',
  });

  try {
    const response = await readHandler(
      new Request('https://example.com/api/state/placeSuggestions')
    );

    assert.equal(response.status, 200);
    assert.equal(mock.patchBodies.length, 0);
  } finally {
    mock.dispose();
  }
});

test('missing pins.json reports both users as missing PINs and bootstraps the key', async () => {
  const mock = createUpstashMemoryMock({
    'movielist.json': '[]',
  });

  try {
    const response = await sessionHandler(new Request('https://example.com/api/session'));

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      hasAccess: true,
      currentUser: null,
      pinProtectedUsers: [],
      usersMissingPins: ['Aaron', 'Electra'],
    });
    assert.equal(mock.patchBodies.length, 1);
    assert.equal(mock.getFile('pins.json'), '{}');
  } finally {
    mock.dispose();
  }
});
