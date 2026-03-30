import test from 'node:test';
import assert from 'node:assert/strict';
import { executeAction, isValidUrl, sanitizeInput, shallowCloneArray } from './shared.ts';

test('executeAction', async (t) => {
  await t.test('runs action and completion in order', () => {
    const calls: string[] = [];

    executeAction(
      () => {
        calls.push('action');
      },
      () => {
        calls.push('complete');
      }
    );

    assert.deepEqual(calls, ['action', 'complete']);
  });

  await t.test('still runs completion when action is missing', () => {
    const calls: string[] = [];

    executeAction(undefined, () => {
      calls.push('complete');
    });

    assert.deepEqual(calls, ['complete']);
  });
});

test('isValidUrl', async (t) => {
  await t.test('returns true for valid HTTP URLs', () => {
    assert.equal(isValidUrl('http://example.com'), true);
    assert.equal(isValidUrl('http://www.example.com'), true);
    assert.equal(isValidUrl('http://example.com/path?query=1#fragment'), true);
  });

  await t.test('returns true for valid HTTPS URLs', () => {
    assert.equal(isValidUrl('https://example.com'), true);
    assert.equal(isValidUrl('https://www.example.com'), true);
    assert.equal(isValidUrl('https://example.com/path?query=1#fragment'), true);
  });

  await t.test('returns false for empty or missing input', () => {
    assert.equal(isValidUrl(''), false);
    // @ts-expect-error Testing invalid runtime input
    assert.equal(isValidUrl(null), false);
    // @ts-expect-error Testing invalid runtime input
    assert.equal(isValidUrl(undefined), false);
  });

  await t.test('returns false for malformed URLs', () => {
    assert.equal(isValidUrl('not-a-url'), false);
    assert.equal(isValidUrl('http://'), false);
    assert.equal(isValidUrl('https://'), false);
  });

  await t.test('returns false for unsafe or unsupported protocols', () => {
    assert.equal(isValidUrl('java' + 'script:alert(1)'), false);
    assert.equal(isValidUrl('javascript:void(0)'), false);
    assert.equal(isValidUrl('data:text/plain,hello'), false);
    assert.equal(isValidUrl('ftp://example.com'), false);
    assert.equal(isValidUrl('file:///local/file.txt'), false);
    assert.equal(
      isValidUrl(['w', 's', ':', '/', '/', 'example.com'].join('')),
      false
    );
    assert.equal(isValidUrl('wss://example.com'), false);
  });

  await t.test('returns false for protocol-relative URLs (missing protocol)', () => {
    // URL constructor throws for protocol-relative unless base is provided
    assert.equal(isValidUrl('/' + '/example.com'), false);
  });
});

test('sanitizeInput', async (t) => {
  await t.test('returns empty string for empty inputs', () => {
    assert.equal(sanitizeInput(''), '');
    // @ts-expect-error Testing invalid runtime input
    assert.equal(sanitizeInput(null), '');
    // @ts-expect-error Testing invalid runtime input
    assert.equal(sanitizeInput(undefined), '');
  });

  await t.test('trims leading and trailing whitespace', () => {
    assert.equal(sanitizeInput('  hello world  '), 'hello world');
    assert.equal(sanitizeInput('\t\n hello \t\n'), 'hello');
  });

  await t.test('removes control characters', () => {
    assert.equal(sanitizeInput('hello\x00world'), 'helloworld');
    assert.equal(sanitizeInput('test\x0B\x0Cdata'), 'testdata');
    assert.equal(sanitizeInput('abc\x1Fdef\x7Fghi'), 'abcdefghi');
  });

  await t.test('keeps normal characters aside from trimming', () => {
    assert.equal(
      sanitizeInput('regular string with numbers 123 and symbols !@#'),
      'regular string with numbers 123 and symbols !@#'
    );
  });

  await t.test('returns empty string for control characters and whitespace only', () => {
    assert.equal(sanitizeInput('\x00\x08 \t\n\x7F'), '');
  });
});

test('shallowCloneArray', async (t) => {

  await t.test('creates a new array with cloned objects', () => {
    const original = [{ id: 1 }, { id: 2 }];
    const cloned = shallowCloneArray(original);

    // Should not be the same array reference
    assert.notEqual(cloned, original);

    // Should have the same deep values
    assert.deepEqual(cloned, original);

    // Should not have the same object references
    assert.notEqual(cloned[0], original[0]);
    assert.notEqual(cloned[1], original[1]);
  });

  await t.test('handles an empty array', () => {
    const original: Record<string, unknown>[] = [];
    const cloned = shallowCloneArray(original);

    assert.notEqual(cloned, original);
    assert.deepEqual(cloned, []);
  });

  await t.test('preserves object properties', () => {
    const original = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25, active: true }];
    const cloned = shallowCloneArray(original);

    assert.deepEqual(cloned, original);
    assert.notEqual(cloned[0], original[0]);
    assert.notEqual(cloned[1], original[1]);

    // Modifying the cloned object should not affect the original
    cloned[0].name = 'Charlie';
    assert.equal(original[0].name, 'Alice');
    assert.equal(cloned[0].name, 'Charlie');
  });
});
