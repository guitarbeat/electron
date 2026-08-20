import test from 'node:test';
import assert from 'node:assert';
import { toHeaders } from './nodeBridge.js';

test('toHeaders', async (t) => {
  await t.test('returns empty Headers for falsy inputs', () => {
    // @ts-expect-error Testing invalid input
    assert.strictEqual(Array.from(toHeaders(undefined)).length, 0);
    // @ts-expect-error Testing invalid input
    assert.strictEqual(Array.from(toHeaders(null)).length, 0);
  });

  await t.test('copies headers from Headers instance', () => {
    const input = new Headers();
    input.append('x-test-1', 'value1');
    input.append('x-test-1', 'value2');
    input.append('x-test-2', 'value3');

    const result = toHeaders(input);
    assert.ok(result instanceof Headers);
    assert.notStrictEqual(result, input); // Ensure it's a new instance
    assert.strictEqual(result.get('x-test-1'), 'value1, value2'); // fetch standard joins with comma
    assert.strictEqual(result.get('x-test-2'), 'value3');
  });

  await t.test('handles Record<string, string | string[] | undefined>', () => {
    const input = {
      'x-test-1': 'value1',
      'x-test-2': ['value2', 'value3'],
      'x-test-3': undefined, // Should be ignored
    };

    const result = toHeaders(input);
    assert.ok(result instanceof Headers);
    assert.strictEqual(result.get('x-test-1'), 'value1');
    assert.strictEqual(result.get('x-test-2'), 'value2, value3');
    assert.strictEqual(result.has('x-test-3'), false);
  });
});
