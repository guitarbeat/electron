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

    it('returns false for relative URLs, protocol-relative, and invalid schemes', () => {
      assert.strictEqual(isAbsoluteUrl('/path/to/resource'), false);
      assert.strictEqual(isAbsoluteUrl('relative/path'), false);
      assert.strictEqual(isAbsoluteUrl('//example.com/path'), false);
      assert.strictEqual(isAbsoluteUrl('123scheme://example.com'), false);
      assert.strictEqual(isAbsoluteUrl('http:/example.com'), false);
      assert.strictEqual(isAbsoluteUrl(''), false);
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

    it('supports custom cache status like MISS', () => {
      const cached: CachedProxyResponse = {
        body: 'data',
        contentType: 'application/json',
        status: 404,
        statusText: 'Not Found',
      };

      const response = cachedProxyResponse(cached, 'MISS');

      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.headers.get('X-Cache'), 'MISS');
    });
  });
});
