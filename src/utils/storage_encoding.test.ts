import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeStorageData, decodeStorageData } from './shared.ts';

test('encodeStorageData and decodeStorageData', async (t) => {

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


  await t.test('handles empty data', () => {
    assert.equal(decodeStorageData(''), '');
  });



  await t.test('gracefully handles natively invalid base64 (e.g. throws DOMException)', () => {
    // atob natively throws if string length is not valid for base64 or has other invalid traits
    // like 'a' which is length 1. It matches regex but throws InvalidCharacterError.
    const invalidBase64 = 'v1:a';
    const decoded = decodeStorageData(invalidBase64);
    assert.equal(invalidBase64, decoded);
  });

  await t.test('encodeStorageData gracefully handles natively invalid string (e.g. throws DOMException)', () => {
    // btoa natively throws if string contains characters outside the Latin1 range.
    const invalidLatin1 = '\uD800\uDC00';
    const encoded = encodeStorageData(invalidLatin1);
    assert.equal(invalidLatin1, encoded);
  });
});
