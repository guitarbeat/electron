import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  cachedProxyResponse,
  jsonProxyResponse,
  isAbsoluteUrl,
  BoundedResponseCache,
  CachedProxyResponse,
} from './cachedProxy.js';

describe('cachedProxy', () => {
  describe('cachedProxyResponse', () => {
    it('formats response with default cache status HIT', async () => {
      const cached: CachedProxyResponse = {
        body: JSON.stringify({ message: 'cached data' }),
        contentType: 'application/json',
        status: 200,
        statusText: 'OK',
      };

      const res = cachedProxyResponse(cached);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.statusText, 'OK');
      assert.strictEqual(res.headers.get('Content-Type'), 'application/json');
      assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
      assert.strictEqual(res.headers.get('X-Cache'), 'HIT');

      const text = await res.text();
      assert.strictEqual(text, JSON.stringify({ message: 'cached data' }));
    });

    it('formats response with specified cache status MISS', async () => {
      const cached: CachedProxyResponse = {
        body: '<html>Hello</html>',
        contentType: 'text/html',
        status: 404,
        statusText: 'Not Found',
      };

      const res = cachedProxyResponse(cached, 'MISS');

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.statusText, 'Not Found');
      assert.strictEqual(res.headers.get('Content-Type'), 'text/html');
      assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
      assert.strictEqual(res.headers.get('X-Cache'), 'MISS');

      const text = await res.text();
      assert.strictEqual(text, '<html>Hello</html>');
    });
  });

  describe('jsonProxyResponse', () => {
    it('creates json response from object', async () => {
      const bodyObj = { foo: 'bar' };
      const res = jsonProxyResponse(bodyObj, 201);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.headers.get('Content-Type'), 'application/json');
      assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');

      const text = await res.text();
      assert.strictEqual(text, JSON.stringify(bodyObj));
    });

    it('creates json response when body is already a string', async () => {
      const jsonString = '{"already":"string"}';
      const res = jsonProxyResponse(jsonString, 200);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('Content-Type'), 'application/json');

      const text = await res.text();
      assert.strictEqual(text, jsonString);
    });
  });

  describe('isAbsoluteUrl', () => {
    it('returns true for absolute URLs', () => {
      assert.strictEqual(isAbsoluteUrl('http://example.com'), true);
      assert.strictEqual(isAbsoluteUrl('https://example.com/path'), true);
      assert.strictEqual(isAbsoluteUrl('ftp://files.org'), true);
      assert.strictEqual(isAbsoluteUrl('custom-scheme://test'), true);
    });

    it('returns false for relative URLs or non-URLs', () => {
      assert.strictEqual(isAbsoluteUrl('/path/to/resource'), false);
      assert.strictEqual(isAbsoluteUrl('relative/path'), false);
      assert.strictEqual(isAbsoluteUrl('example.com/path'), false);
      assert.strictEqual(isAbsoluteUrl('://invalid'), false);
      assert.strictEqual(isAbsoluteUrl(''), false);
    });
  });

  describe('BoundedResponseCache', () => {
    it('stores and retrieves cached items before expiration', () => {
      let nowTime = 1000;
      const cache = new BoundedResponseCache<string>({
        ttlMs: 500,
        maxEntries: 10,
        now: () => nowTime,
      });

      cache.set('key1', 'value1');
      assert.strictEqual(cache.get('key1'), 'value1');

      nowTime = 1499;
      assert.strictEqual(cache.get('key1'), 'value1');

      nowTime = 1500;
      assert.strictEqual(cache.get('key1'), undefined);
    });

    it('evicts expired entries on set and get', () => {
      let nowTime = 1000;
      const cache = new BoundedResponseCache<string>({
        ttlMs: 1000,
        maxEntries: 5,
        now: () => nowTime,
      });

      cache.set('key1', 'val1');
      cache.set('key2', 'val2');

      nowTime = 2500; // key1 and key2 expired
      cache.set('key3', 'val3');

      assert.strictEqual(cache.get('key1'), undefined);
      assert.strictEqual(cache.get('key2'), undefined);
      assert.strictEqual(cache.get('key3'), 'val3');
    });

    it('evicts oldest LRU entry when maxEntries is reached', () => {
      let nowTime = 1000;
      const cache = new BoundedResponseCache<string>({
        ttlMs: 10000,
        maxEntries: 2,
        now: () => nowTime,
      });

      cache.set('k1', 'v1');
      cache.set('k2', 'v2');

      // Access k1 to make k2 the LRU
      cache.get('k1');

      cache.set('k3', 'v3');

      assert.strictEqual(cache.get('k1'), 'v1');
      assert.strictEqual(cache.get('k2'), undefined); // k2 was evicted
      assert.strictEqual(cache.get('k3'), 'v3');
    });
  });
});
