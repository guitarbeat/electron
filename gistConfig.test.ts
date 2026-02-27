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

test('GIST_TOKEN should not match known compromised token', () => {
  const COMPROMISED_TOKEN = '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';
  assert.notEqual(
    GIST_TOKEN,
    COMPROMISED_TOKEN,
    'GIST_TOKEN must not match the known compromised token'
  );
});
