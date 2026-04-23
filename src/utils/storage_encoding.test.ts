import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeStorageData, decodeStorageData } from './shared.ts';

test('encodeStorageData and decodeStorageData', async (t) => {
  // Mock btoa/atob for Node environment
  globalThis.btoa = (s: string) => Buffer.from(s, 'binary').toString('base64');
  globalThis.atob = (s: string) => Buffer.from(s, 'base64').toString('binary');

  await t.test('encodes and decodes data correctly', () => {
    const original = JSON.stringify({ foo: 'bar', secret: 123 });
    const encoded = encodeStorageData(original);
    
    assert.notEqual(original, encoded);
    assert.ok(encoded.startsWith('v1:'));
    
    const decoded = decodeStorageData(encoded);
    assert.equal(original, decoded);
    assert.deepEqual(JSON.parse(decoded), { foo: 'bar', secret: 123 });
  });

  await t.test('handles legacy plaintext data', () => {
    const legacy = JSON.stringify({ legacy: true });
    const decoded = decodeStorageData(legacy);
    assert.equal(legacy, decoded);
  });

  await t.test('handles non-JSON versioned data', () => {
    const original = 'plain text';
    const encoded = encodeStorageData(original);
    const decoded = decodeStorageData(encoded);
    assert.equal(original, decoded);
  });

  await t.test('gracefully handles malformed v1: data', () => {
    const malformed = 'v1:!!!not-base64!!!';
    const decoded = decodeStorageData(malformed);
    assert.equal(malformed, decoded);
  });
});
