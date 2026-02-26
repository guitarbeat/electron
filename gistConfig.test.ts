import assert from 'node:assert/strict';
import test from 'node:test';
import { GIST_TOKEN } from './config/gistConfig.ts';

test('GIST_TOKEN should be empty when env var is missing', () => {
  // It should be undefined or empty in test environment since env var is not set
  // This confirms we are relying on environment variables and not a hardcoded fallback
  assert.ok(
    !GIST_TOKEN || GIST_TOKEN === '',
    'GIST_TOKEN should be empty/undefined when env var is missing'
  );
});
