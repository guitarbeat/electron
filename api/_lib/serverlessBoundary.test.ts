import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import test from 'node:test';

test('serverless handlers do not import browser service entrypoints', () => {
  const apiRoot = new URL('../', import.meta.url);
  const files = globSync('**/*.ts', {
    cwd: apiRoot,
    exclude: ['**/*.test.ts'],
  });

  const violations = files.flatMap((file) => {
    const source = readFileSync(new URL(file, apiRoot), 'utf8');
    return source.includes('apps/web/src/services/state/index') ||
      source.includes('apps/web/src/services/content/index')
      ? [file]
      : [];
  });

  assert.deepEqual(
    violations,
    [],
    `serverless imports cross into browser service entrypoints: ${violations.join(', ')}`,
  );
});
