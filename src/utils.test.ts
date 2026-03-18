import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeInput } from './utils.ts';

describe('sanitizeInput', () => {
  it('returns empty string for empty inputs', () => {
    assert.strictEqual(sanitizeInput(''), '');
    assert.strictEqual(sanitizeInput(null as any), '');
    assert.strictEqual(sanitizeInput(undefined as any), '');
  });

  it('trims leading and trailing whitespace', () => {
    assert.strictEqual(sanitizeInput('  hello world  '), 'hello world');
    assert.strictEqual(sanitizeInput('\t\n hello \t\n'), 'hello');
  });

  it('removes control characters', () => {
    // \x00 is null, \x08 is backspace, \x0B is vertical tab, etc.
    assert.strictEqual(sanitizeInput('hello\x00world'), 'helloworld');
    assert.strictEqual(sanitizeInput('test\x0B\x0Cdata'), 'testdata');
    assert.strictEqual(sanitizeInput('abc\x1Fdef\x7Fghi'), 'abcdefghi');
  });

  it('handles normal characters without modification (other than trimming)', () => {
    assert.strictEqual(sanitizeInput('regular string with numbers 123 and symbols !@#'), 'regular string with numbers 123 and symbols !@#');
  });

  it('returns empty string when input is only control characters and whitespace', () => {
    assert.strictEqual(sanitizeInput('\x00\x08 \t\n\x7F'), '');
  });
});
