import assert from 'node:assert/strict';
import test from 'node:test';

import { applyFetchResponseHeaders } from '../../api/_lib/nodeBridge.ts';

test('applyFetchResponseHeaders preserves multiple Set-Cookie headers', () => {
  const headers = new Headers();
  headers.append('Set-Cookie', 'movie_watch_profile=profile-token; Path=/; HttpOnly');
  headers.append('Set-Cookie', 'movie_watch_pin_attempt=; Path=/; HttpOnly; Max-Age=0');
  headers.set('Content-Type', 'application/json');

  const response = new Response(JSON.stringify({ ok: true }), { headers });

  const writtenHeaders = new Map<string, string | string[]>();
  applyFetchResponseHeaders(
    {
      setHeader(name, value) {
        writtenHeaders.set(name.toLowerCase(), value);
      },
    },
    response
  );

  assert.deepEqual(writtenHeaders.get('set-cookie'), [
    'movie_watch_profile=profile-token; Path=/; HttpOnly',
    'movie_watch_pin_attempt=; Path=/; HttpOnly; Max-Age=0',
  ]);
  assert.equal(writtenHeaders.get('content-type'), 'application/json');
});
