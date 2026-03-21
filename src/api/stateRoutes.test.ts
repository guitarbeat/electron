import assert from 'node:assert/strict';
import test from 'node:test';

import mutateHandler from '../../api/state/[scope]/mutate.ts';
import readHandler from '../../api/state/[scope].ts';

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
