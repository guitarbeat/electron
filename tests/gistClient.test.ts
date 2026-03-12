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

test('isGistWriteConfigured relies on gist id when using the proxy', () => {
  assert.equal(isGistWriteConfigured(''), false);
  assert.equal(isGistWriteConfigured('   '), false);
  assert.equal(isGistWriteConfigured('abc123'), true);
});
