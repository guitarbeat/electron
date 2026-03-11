import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isGistReadConfigured,
  isGistWriteConfigured,
} from '../src/services/gistClient.ts';

test('isGistReadConfigured requires a non-empty gist id', () => {
  assert.equal(isGistReadConfigured(''), false);
  assert.equal(isGistReadConfigured('   '), false);
  assert.equal(isGistReadConfigured('"abc123"'), true);
});

test('isGistWriteConfigured requires both gist id and token', () => {
  assert.equal(isGistWriteConfigured('', ''), false);
  assert.equal(isGistWriteConfigured('abc123', ''), false);
  assert.equal(isGistWriteConfigured('', 'token'), false);
  assert.equal(isGistWriteConfigured('abc123', 'token'), true);
});
