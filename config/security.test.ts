import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeInput } from './security.ts';

test('sanitizeInput returns empty string for null/undefined/empty input', () => {
  assert.equal(sanitizeInput(''), '');
  // @ts-expect-error - testing runtime behavior for non-string inputs
  assert.equal(sanitizeInput(null), '');
  // @ts-expect-error - testing runtime behavior for non-string inputs
  assert.equal(sanitizeInput(undefined), '');
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
