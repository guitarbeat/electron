#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const checks = [
  {
    name: 'compiled health handler',
    moduleUrl: new URL(
      '../.vercel/output/functions/api/health.func/api/health.js',
      import.meta.url,
    ),
    request: new Request('https://local.test/api/health'),
    validate: async (response) => {
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true, liveness: true });
    },
  },
  {
    name: 'compiled state handler',
    moduleUrl: new URL(
      '../.vercel/output/functions/api/state/[scope].func/api/state/[scope].js',
      import.meta.url,
    ),
    request: new Request('https://local.test/api/state/movies?scope=movies'),
    validate: async (response) => {
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.ok(body && typeof body === 'object');
      assert.ok(Array.isArray(body.data));
      assert.equal(typeof body.version, 'string');
    },
  },
];

for (const check of checks) {
  assert.ok(
    existsSync(check.moduleUrl),
    `${check.name} is missing; run \`vercel build --prod\` first`,
  );

  const compiledModule = await import(check.moduleUrl);
  assert.equal(typeof compiledModule.default, 'function');
  await check.validate(await compiledModule.default(check.request));
  console.log(`✓ ${check.name}`);
}
