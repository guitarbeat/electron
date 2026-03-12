import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeInput, isValidUrl } from '../src/utils/index.ts';

test('sanitizeInput trims and strips control characters', () => {
  const input = '  hello\u0007 world\u0000  ';
  assert.equal(sanitizeInput(input), 'hello world');
});

test('sanitizeInput returns empty string for falsy input', () => {
  assert.equal(sanitizeInput(''), '');
});

test('isValidUrl accepts http and https only', () => {
  assert.equal(isValidUrl('https://example.com'), true);
  assert.equal(isValidUrl('http://example.com'), true);
  assert.equal(isValidUrl(`javascript${':'}alert(1)`), false);
  assert.equal(isValidUrl('data:text/html,hello'), false);
  assert.equal(isValidUrl('not-a-url'), false);
});
