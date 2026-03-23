import assert from 'node:assert/strict';
import test from 'node:test';

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

