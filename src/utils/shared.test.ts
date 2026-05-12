import { spacing } from '../theme/tokens.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  layouts,
  areDeeplyEqual,
  createValidator,
  executeAction,
  isValidUrl,
  parseJsonContent,
  sanitizeInput,
} from './shared.ts';

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

test('createValidator', async (t) => {
  await t.test('validates valid data successfully', () => {
    const validator = createValidator({
      name: { required: true, maxLength: 50 },
      age: { custom: (val) => Number.isNaN(Number(val)) ? 'Must be a number' : null }
    });

    const result = validator({ name: 'John Doe', age: '30' });
    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, {});
    assert.deepEqual(result.fieldErrors, []);
  });

  await t.test('enforces required rule', () => {
    const validator = createValidator({
      name: { required: true, message: 'Name is mandatory' },
      optional: { required: false }
    });

    const result = validator({ optional: 'present' });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { name: 'Name is mandatory' });
    assert.deepEqual(result.fieldErrors, ['Name is mandatory']);
  });

  await t.test('enforces maxLength rule', () => {
    const validator = createValidator({
      code: { maxLength: 3 }
    });

    const result = validator({ code: 'ABCD' });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { code: 'code exceeds maximum length of 3 characters' });
  });

  await t.test('enforces minLength rule', () => {
    const validator = createValidator({
      pin: { minLength: 4 }
    });

    const result = validator({ pin: '123' });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { pin: 'pin must be at least 4 characters' });
  });

  await t.test('enforces pattern rule', () => {
    const validator = createValidator({
      email: { pattern: /^[^@]+@[^@]+\.[^@]+$/ }
    });

    const result = validator({ email: 'invalid-email' });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { email: 'email format is invalid' });
  });

  await t.test('enforces custom rule', () => {
    const validator = createValidator({
      username: { custom: (val) => val === 'admin' ? 'Reserved username' : null }
    });

    const result = validator({ username: 'admin' });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { username: 'Reserved username' });
  });

  await t.test('trims whitespace before validation', () => {
    const validator = createValidator({
      name: { required: true },
      code: { maxLength: 3 }
    });

    const resultEmpty = validator({ name: '   ' });
    assert.equal(resultEmpty.isValid, false);
    assert.equal(resultEmpty.errors.name, 'name is required');

    const resultLength = validator({ name: 'Valid', code: '  AB  ' });
    assert.equal(resultLength.isValid, true);
  });

  await t.test('ignores missing non-required fields', () => {
    const validator = createValidator({
      bio: { maxLength: 10 } // Not required
    });

    const result = validator({}); // Missing
    assert.equal(result.isValid, true);

    const resultEmpty = validator({ bio: '' }); // Empty
    assert.equal(resultEmpty.isValid, true);
  });

  await t.test('coerces non-string values to string', () => {
    const validator = createValidator({
      count: { minLength: 2 }
    });

    // Number 5 will be coerced to "5", which is 1 char (less than minLength 2)
    const result = validator({ count: 5 });
    assert.equal(result.isValid, false);
    assert.equal(result.errors.count, 'count must be at least 2 characters');
  });

  await t.test('accumulates multiple errors across different fields', () => {
    const validator = createValidator({
      name: { required: true },
      age: { required: true }
    });

    const result = validator({});
    assert.equal(result.isValid, false);
    assert.equal(Object.keys(result.errors).length, 2);
    assert.equal(result.fieldErrors.length, 2);
  });
});

test('layouts', async (t) => {
  await t.test('centeredContainer returns expected static object', () => {
    assert.deepEqual(layouts.centeredContainer, {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `0 ${spacing.md}`
    });
  });

  await t.test('grid returns correct styles with default params', () => {
    assert.deepEqual(layouts.grid(), {
      display: 'grid',
      gridTemplateColumns: 'repeat(1, 1fr)',
      gap: spacing.md,
    });
  });

  await t.test('grid returns correct styles with custom params', () => {
    assert.deepEqual(layouts.grid(3, '24px'), {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
    });
  });

  await t.test('stack returns correct styles with default gap', () => {
    assert.deepEqual(layouts.stack(), {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
    });
  });

  await t.test('stack returns correct styles with custom gap', () => {
    assert.deepEqual(layouts.stack('8px'), {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    });
  });

  await t.test('inlineStack returns correct styles with default gap', () => {
    assert.deepEqual(layouts.inlineStack(), {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
    });
  });

  await t.test('inlineStack returns correct styles with custom gap', () => {
    assert.deepEqual(layouts.inlineStack('32px'), {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
    });
  });

  await t.test('flexRow returns correct styles with default params', () => {
    assert.deepEqual(layouts.flexRow(), {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: spacing.md,
    });
  });

  await t.test('flexRow returns correct styles with custom params', () => {
    assert.deepEqual(layouts.flexRow('space-between', 'flex-start', '10px'), {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '10px',
    });
  });
});
