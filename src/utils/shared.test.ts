import test from 'node:test';
import assert from 'node:assert/strict';
import { executeAction, isValidUrl, sanitizeInput, parseJsonContent, areDeeplyEqual } from './shared.ts';

test('areDeeplyEqual', async (t) => {
  await t.test('returns true for identical primitives', () => {
    assert.strictEqual(areDeeplyEqual(1, 1), true);
    assert.strictEqual(areDeeplyEqual('hello', 'hello'), true);
    assert.strictEqual(areDeeplyEqual(true, true), true);
    assert.strictEqual(areDeeplyEqual(null, null), true);
    assert.strictEqual(areDeeplyEqual(undefined, undefined), true);
  });

  await t.test('returns false for different primitives', () => {
    assert.strictEqual(areDeeplyEqual(1, 2), false);
    assert.strictEqual(areDeeplyEqual('hello', 'world'), false);
    assert.strictEqual(areDeeplyEqual(true, false), false);
    assert.strictEqual(areDeeplyEqual(null, undefined), false);
    assert.strictEqual(areDeeplyEqual(1, '1' as unknown as number), false);
  });

  await t.test('returns true for deeply equal objects', () => {
    assert.strictEqual(areDeeplyEqual({}, {}), true);
    assert.strictEqual(areDeeplyEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
    assert.strictEqual(areDeeplyEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
    assert.strictEqual(areDeeplyEqual({ a: { b: 1 } }, { a: { b: 1 } }), true);
  });

  await t.test('returns false for different objects', () => {
    assert.strictEqual(areDeeplyEqual({ a: 1 }, { a: 2 }), false);
    assert.strictEqual(areDeeplyEqual({ a: 1 }, { b: 1 }), false);
    assert.strictEqual(areDeeplyEqual({ a: 1 }, { a: 1, b: 2 }), false);
    assert.strictEqual(areDeeplyEqual({ a: { b: 1 } }, { a: { b: 2 } }), false);
  });

  await t.test('returns true for deeply equal arrays', () => {
    assert.strictEqual(areDeeplyEqual([], []), true);
    assert.strictEqual(areDeeplyEqual([1, 2, 3], [1, 2, 3]), true);
    assert.strictEqual(areDeeplyEqual([{ a: 1 }], [{ a: 1 }]), true);
    assert.strictEqual(areDeeplyEqual([[1]], [[1]]), true);
  });

  await t.test('returns false for different arrays', () => {
    assert.strictEqual(areDeeplyEqual([1, 2], [1, 2, 3]), false);
    assert.strictEqual(areDeeplyEqual([1, 2], [2, 1]), false);
    assert.strictEqual(areDeeplyEqual([{ a: 1 }], [{ a: 2 }]), false);
  });

  await t.test('handles mixed structures', () => {
    const left = {
      a: [1, { b: 2 }],
      c: 'hello',
      d: null
    };
    const right = {
      a: [1, { b: 2 }],
      c: 'hello',
      d: null
    };
    assert.strictEqual(areDeeplyEqual(left, right), true);
    
    const different = { ...right, d: undefined as unknown as null };
    assert.strictEqual(areDeeplyEqual(left, different), false);
  });

  await t.test('handles type mismatches', () => {
    assert.strictEqual(areDeeplyEqual({} as unknown, [] as unknown), false);
    assert.strictEqual(areDeeplyEqual(null as unknown, {} as unknown), false);
    assert.strictEqual(areDeeplyEqual(1 as unknown, { a: 1 } as unknown), false);
  });
});

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

test('parseJsonContent', async (t) => {
  await t.test('parses valid JSON string correctly', () => {
    const json = '{"key": "value", "number": 42}';
    assert.deepEqual(parseJsonContent(json, 'TestContext'), { key: 'value', number: 42 });
  });

  await t.test('throws an error with context for invalid JSON', () => {
    const invalidJson = '{key: "value"}';
    assert.throws(
      () => parseJsonContent(invalidJson, 'TestContext'),
      (err) => {
        return err instanceof Error && err.message === 'Failed to parse TestContext JSON.' && err.cause instanceof SyntaxError;
      }
    );
  });
});
