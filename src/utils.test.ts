import test from 'node:test';
import assert from 'node:assert/strict';
import { executeAction, isValidUrl } from './utils.ts';

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
    assert.equal(isValidUrl(null as unknown as string), false);
    assert.equal(isValidUrl(undefined as unknown as string), false);
  });

  await t.test('returns false for malformed URLs', () => {
    assert.equal(isValidUrl('not-a-url'), false);
    assert.equal(isValidUrl('http://'), false);
    assert.equal(isValidUrl('https://'), false);
  });

  await t.test('returns false for unsafe or unsupported protocols', () => {
    assert.equal(isValidUrl('java' + 'script:alert(1)'), false);
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
