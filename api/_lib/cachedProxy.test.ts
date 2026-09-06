import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isAbsoluteUrl,
  BoundedResponseCache,
  jsonProxyResponse,
  cachedProxyResponse,
  type CachedProxyResponse,
} from './cachedProxy';

describe('cachedProxy utilities', () => {
  describe('isAbsoluteUrl', () => {
    it('returns true for valid absolute URLs with standard schemes', () => {
      assert.strictEqual(isAbsoluteUrl('http://example.com'), true);
      assert.strictEqual(isAbsoluteUrl('https://example.com/path?query=1'), true);
      assert.strictEqual(isAbsoluteUrl('ftp://files.example.com'), true);
    });

    it('returns true for scheme names with +, -, ., and case-insensitivity', () => {
      assert.strictEqual(isAbsoluteUrl('HTTP://example.com'), true);
      assert.strictEqual(isAbsoluteUrl('git+ssh://github.com/user/repo'), true);
      assert.strictEqual(isAbsoluteUrl('custom-scheme.1://test'), true);
    });

    it('returns true for additional valid URL schemes including ws, wss, single-letter, and digits', () => {
      assert.strictEqual(isAbsoluteUrl('ws://example.com/socket'), true);
      assert.strictEqual(isAbsoluteUrl('wss://example.com/socket'), true);
      assert.strictEqual(isAbsoluteUrl('a://test'), true);
      assert.strictEqual(isAbsoluteUrl('h321://example.com'), true);
    });

    it('returns false for relative URLs, protocol-relative, and invalid schemes', () => {
      assert.strictEqual(isAbsoluteUrl('/path/to/resource'), false);
      assert.strictEqual(isAbsoluteUrl('relative/path'), false);
      assert.strictEqual(isAbsoluteUrl('//example.com/path'), false);
      assert.strictEqual(isAbsoluteUrl('123scheme://example.com'), false);
      assert.strictEqual(isAbsoluteUrl('http:/example.com'), false);
      assert.strictEqual(isAbsoluteUrl(''), false);
    });

    it('returns false for invalid scheme characters, missing slashes, or invalid formatting', () => {
      assert.strictEqual(isAbsoluteUrl('bad_scheme://example.com'), false);
      assert.strictEqual(isAbsoluteUrl('user@host://example.com'), false);
      assert.strictEqual(isAbsoluteUrl('mailto:user@example.com'), false);
      assert.strictEqual(isAbsoluteUrl('javascript:alert(1)'), false);
      assert.strictEqual(isAbsoluteUrl(' https://example.com'), false);
      assert.strictEqual(isAbsoluteUrl('http://'), true);
      assert.strictEqual(isAbsoluteUrl('://example.com'), false);
    });
  });

  describe('BoundedResponseCache', () => {
    it('stores and retrieves non-expired entries', () => {
      const now = 1000;
      const cache = new BoundedResponseCache<string>({
        ttlMs: 5000,
        maxEntries: 3,
        now: () => now,
      });

      cache.set('key1', 'val1');
      assert.strictEqual(cache.get('key1'), 'val1');
    });

    it('returns undefined and deletes expired entries on get', () => {
      let now = 1000;
      const cache = new BoundedResponseCache<string>({
        ttlMs: 1000,
        maxEntries: 3,
        now: () => now,
      });

      cache.set('key1', 'val1');
      now = 2500; // Passed ttlMs
      assert.strictEqual(cache.get('key1'), undefined);
    });

    it('cleans up expired entries during set and evicts oldest entry when maxEntries is reached', () => {
      const now = 1000;
      const cache = new BoundedResponseCache<string>({
        ttlMs: 5000,
        maxEntries: 2,
        now: () => now,
      });

      cache.set('key1', 'val1');
      cache.set('key2', 'val2');

      // Refresh key1 access order
      cache.get('key1');

      // Adding 3rd key should evict oldest (key2, since key1 was accessed and re-inserted)
      cache.set('key3', 'val3');

      assert.strictEqual(cache.get('key1'), 'val1');
      assert.strictEqual(cache.get('key2'), undefined);
      assert.strictEqual(cache.get('key3'), 'val3');
    });

    it('purges expired entries during set before evicting maxEntries', () => {
      let now = 1000;
      const cache = new BoundedResponseCache<string>({
        ttlMs: 2000,
        maxEntries: 2,
        now: () => now,
      });

      cache.set('key1', 'val1');
      cache.set('key2', 'val2');

      now = 3500; // Both key1 and key2 are expired now
      cache.set('key3', 'val3');

      assert.strictEqual(cache.get('key1'), undefined);
      assert.strictEqual(cache.get('key2'), undefined);
      assert.strictEqual(cache.get('key3'), 'val3');
    });

    it('updates value and resets expiration when overwriting an existing key', () => {
      let now = 1000;
      const cache = new BoundedResponseCache<string>({
        ttlMs: 2000,
        maxEntries: 2,
        now: () => now,
      });

      cache.set('key1', 'v1');
      now = 2000;
      cache.set('key1', 'v2'); // Overwrites key1 at t=2000, expires at t=4000

      now = 2500; // Past initial expiration (t=3000), but before new expiration (t=4000)
      assert.strictEqual(cache.get('key1'), 'v2');
    });
  });

  describe('jsonProxyResponse', () => {
    it('creates a Response with JSON serialized object body and default headers', async () => {
      const data = { success: true };
      const response = jsonProxyResponse(data, 200);

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get('Content-Type'), 'application/json');
      assert.strictEqual(response.headers.get('Cache-Control'), 'no-store');
      assert.strictEqual(await response.text(), JSON.stringify(data));
    });

    it('handles raw string body without double JSON stringifying', async () => {
      const rawJsonString = '{"custom":"json"}';
      const response = jsonProxyResponse(rawJsonString, 400);

      assert.strictEqual(response.status, 400);
      assert.strictEqual(await response.text(), rawJsonString);
    });

    it('serializes numbers, booleans, and null values properly', async () => {
      const numResp = jsonProxyResponse(42, 200);
      assert.strictEqual(await numResp.text(), '42');

      const boolResp = jsonProxyResponse(false, 200);
      assert.strictEqual(await boolResp.text(), 'false');

      const nullResp = jsonProxyResponse(null, 200);
      assert.strictEqual(await nullResp.text(), 'null');
    });
  });

  describe('cachedProxyResponse', () => {
    it('creates a Response from CachedProxyResponse with default X-Cache HIT header', async () => {
      const cached: CachedProxyResponse = {
        body: 'response body',
        contentType: 'text/html',
        status: 200,
        statusText: 'OK',
      };

      const response = cachedProxyResponse(cached);

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.statusText, 'OK');
      assert.strictEqual(response.headers.get('Content-Type'), 'text/html');
      assert.strictEqual(response.headers.get('Cache-Control'), 'no-store');
      assert.strictEqual(response.headers.get('X-Cache'), 'HIT');
      assert.strictEqual(await response.text(), 'response body');
    });

    it('supports explicit cache status parameters HIT and MISS', async () => {
      const cached: CachedProxyResponse = {
        body: '{"key":"value"}',
        contentType: 'application/json',
        status: 200,
        statusText: 'OK',
      };

      const hitResponse = cachedProxyResponse(cached, 'HIT');
      assert.strictEqual(hitResponse.headers.get('X-Cache'), 'HIT');
      assert.strictEqual(await hitResponse.text(), '{"key":"value"}');

      const missResponse = cachedProxyResponse(cached, 'MISS');
      assert.strictEqual(missResponse.headers.get('X-Cache'), 'MISS');
      assert.strictEqual(await missResponse.text(), '{"key":"value"}');
    });

    it('preserves status codes and custom statusText', () => {
      const statuses = [
        { status: 200, statusText: 'OK' },
        { status: 201, statusText: 'Created' },
        { status: 400, statusText: 'Bad Request' },
        { status: 404, statusText: 'Not Found' },
        { status: 500, statusText: 'Internal Server Error' },
        { status: 502, statusText: 'Bad Gateway' },
      ];

      for (const { status, statusText } of statuses) {
        const cached: CachedProxyResponse = {
          body: 'content',
          contentType: 'application/json',
          status,
          statusText,
        };

        const response = cachedProxyResponse(cached);
        assert.strictEqual(response.status, status);
        assert.strictEqual(response.statusText, statusText);
      }
    });

    it('handles empty string body and varied content types correctly', async () => {
      const cachedEmpty: CachedProxyResponse = {
        body: '',
        contentType: 'text/plain',
        status: 200,
        statusText: 'OK',
      };

      const response = cachedProxyResponse(cachedEmpty, 'HIT');
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.statusText, 'OK');
      assert.strictEqual(response.headers.get('Content-Type'), 'text/plain');
      assert.strictEqual(response.headers.get('Cache-Control'), 'no-store');
      assert.strictEqual(await response.text(), '');
    });

    it('allows parsing response body via .json() when contentType is application/json', async () => {
      const cachedJson: CachedProxyResponse = {
        body: JSON.stringify({ id: 123, name: 'test' }),
        contentType: 'application/json; charset=utf-8',
        status: 200,
        statusText: 'OK',
      };

      const response = cachedProxyResponse(cachedJson, 'HIT');
      assert.strictEqual(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
      const data = await response.json();
      assert.deepStrictEqual(data, { id: 123, name: 'test' });
    });
  });
});
