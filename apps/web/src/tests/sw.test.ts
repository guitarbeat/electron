import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

describe('service worker sw.js CACHE_URLS pre-warming', () => {
  let listeners: Record<string, (event: any) => void> = {};
  let mockCacheStore: Map<string, any>;
  let fetchedUrls: string[];
  let putUrls: string[];

  beforeEach(() => {
    listeners = {};
    mockCacheStore = new Map();
    fetchedUrls = [];
    putUrls = [];

    const mockCache = {
      keys: async () => {
        return Array.from(mockCacheStore.keys()).map((url) => ({ url }));
      },
      match: async (url: string) => {
        const fullUrl = new URL(url, 'http://localhost').href;
        return mockCacheStore.get(fullUrl) || null;
      },
      put: async (url: string, response: any) => {
        const fullUrl = new URL(url, 'http://localhost').href;
        mockCacheStore.set(fullUrl, response);
        putUrls.push(url);
      },
    };

    const mockCaches = {
      open: async () => mockCache,
      keys: async () => ['electron-media-v14'],
      delete: async () => true,
      match: async () => null,
    };

    (globalThis as any).self = {
      location: { origin: 'http://localhost' },
      addEventListener: (type: string, listener: (event: any) => void) => {
        listeners[type] = listener;
      },
      skipWaiting: () => {},
      clients: { claim: () => {} },
    };

    (globalThis as any).caches = mockCaches;
    (globalThis as any).fetch = async (url: string) => {
      fetchedUrls.push(url);
      return { ok: true, type: 'basic' };
    };

    // Load sw.js code in mock environment
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const swPath = path.resolve(__dirname, '../../public/sw.js');
    const swCode = fs.readFileSync(swPath, 'utf8');

    // Execute sw.js code in global context
    const fn = new Function('self', 'caches', 'fetch', swCode);
    fn((globalThis as any).self, (globalThis as any).caches, (globalThis as any).fetch);
  });

  afterEach(() => {
    delete (globalThis as any).self;
    delete (globalThis as any).caches;
    delete (globalThis as any).fetch;
  });

  it('pre-warms un-cached URLs and skips already cached URLs using bulk cache.keys()', async () => {
    const messageListener = listeners['message'];
    assert.ok(messageListener, 'message listener should be registered in sw.js');

    // Pre-populate cache store with one URL
    const preCachedUrl = 'http://localhost/image1.jpg';
    mockCacheStore.set(preCachedUrl, { ok: true });

    let waitUntilPromise: Promise<any> | null = null;

    messageListener({
      data: {
        type: 'CACHE_URLS',
        urls: [
          '/image1.jpg', // Already cached
          '/image2.jpg', // New
          'https://external.com/image3.jpg', // New
        ],
      },
      waitUntil: (p: Promise<any>) => {
        waitUntilPromise = p;
      },
    });

    assert.ok(waitUntilPromise, 'waitUntil should be called');
    await waitUntilPromise;

    // /image1.jpg should not be fetched because bulk cache.keys() identified it as cached
    assert.deepEqual(fetchedUrls, ['/image2.jpg', 'https://external.com/image3.jpg']);
    assert.deepEqual(putUrls, ['/image2.jpg', 'https://external.com/image3.jpg']);
  });
});
