import assert from 'node:assert/strict';
import test from 'node:test';

import handler from '../../api/gist.ts';

test('OPTIONS still advertises the deprecated route without enabling writes', async () => {
  const response = await handler(
    new Request('https://example.com/api/gist', {
      method: 'OPTIONS',
    })
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Allow'), 'GET, PATCH, OPTIONS');
});

test('GET returns gone for the deprecated generic proxy', async () => {
  const response = await handler(new Request('https://example.com/api/gist'));

  assert.equal(response.status, 410);
  assert.equal(response.headers.get('Allow'), 'GET, PATCH, OPTIONS');
  assert.match(
    await response.text(),
    /generic Gist proxy is disabled/i
  );
});

test('PATCH returns gone for the deprecated generic proxy', async () => {
  const response = await handler(
    new Request('https://example.com/api/gist', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'movies.json': {
            content: '[]',
          },
        },
      }),
    })
  );

  assert.equal(response.status, 410);
  assert.equal(response.headers.get('Allow'), 'GET, PATCH, OPTIONS');
  assert.match(
    await response.text(),
    /use \/api\/session and \/api\/state\/:scope/i
  );
});
