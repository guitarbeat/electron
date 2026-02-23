import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeInput, isValidUrl } from './security.ts';

test('sanitizeInput returns empty string for null/undefined/empty input', () => {
  assert.equal(sanitizeInput(''), '');
  assert.equal(sanitizeInput(null as any), '');
  assert.equal(sanitizeInput(undefined as any), '');
});

test('sanitizeInput trims leading and trailing whitespace', () => {
  assert.equal(sanitizeInput('  hello  '), 'hello');
  assert.equal(sanitizeInput('\n  hello\t  '), 'hello');
});

test('sanitizeInput preserves normal characters', () => {
  const input = 'Hello World 123! @#$%^&*()';
  assert.equal(sanitizeInput(input), input);
});

test('sanitizeInput removes control characters', () => {
  // \x00 - NULL
  // \x07 - BEL
  // \x1F - Unit Separator
  // \x7F - DEL
  const input = 'hello\x00world\x07!\x1F\x7F';
  assert.equal(sanitizeInput(input), 'helloworld!');
});

test('sanitizeInput preserves allowed whitespace characters', () => {
  // \x09 - Tab
  // \x0A - LF
  // \x0D - CR
  const input = 'line1\nline2\r\ntab\tspace';
  assert.equal(sanitizeInput(input), input);
});

test('sanitizeInput handles complex mixed input', () => {
  const input = ' \x01  Clean \n This \t Up \x1B  ';
  // \x01 (SOH) and \x1B (ESC) should be removed.
  // Trimming should remove outer spaces.
  assert.equal(sanitizeInput(input), 'Clean \n This \t Up');
});

test('isValidUrl returns true for valid http/https URLs', () => {
  assert.equal(isValidUrl('http://example.com'), true);
  assert.equal(isValidUrl('https://example.com'), true);
  assert.equal(isValidUrl('https://sub.domain.com/path?query=1'), true);
});

test('isValidUrl returns false for invalid schemes', () => {
  assert.equal(isValidUrl('javascript:alert(1)'), false);
  assert.equal(isValidUrl('file:///etc/passwd'), false);
  assert.equal(isValidUrl('ftp://example.com'), false);
  assert.equal(isValidUrl('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='), false);
});

test('isValidUrl returns false for malformed URLs', () => {
  assert.equal(isValidUrl('not a url'), false);
  // URL constructor might throw or parse "http:" oddly depending on implementation, but typically it fails without host in some envs, or parses as opaque.
  // In Node, new URL('http:') throws.
  assert.equal(isValidUrl('http:'), false);
  assert.equal(isValidUrl(''), false);
  assert.equal(isValidUrl(null as any), false);
  assert.equal(isValidUrl(undefined as any), false);
});
