/* Electron PWA service worker — app-shell cache for installability + offline support */
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `electron-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `electron-runtime-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/electron-logo-mark.png',
  '/manifest.json',
];

// Max entries for runtime cache to prevent unbounded growth
const RUNTIME_CACHE_MAX_ENTRIES = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * Trim runtime cache to prevent storage bloat on long-lived installations.
 */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // Delete oldest entries (FIFO)
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((req) => cache.delete(req)));
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for navigations — app updates promptly when online.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(STATIC_CACHE)
            .then((c) => c.put('/index.html', copy))
            .catch(() => undefined);
          return res;
        })
        .catch(() =>
          caches.match('/index.html').then((r) => r || caches.match('/')),
        ),
    );
    return;
  }

  // Hashed assets (fingerprinted filenames) — cache-first, immutable.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches
                .open(RUNTIME_CACHE)
                .then((c) => {
                  c.put(req, copy);
                  trimCache(RUNTIME_CACHE, RUNTIME_CACHE_MAX_ENTRIES);
                })
                .catch(() => undefined);
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Other same-origin requests — stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (
            res.ok &&
            (req.destination === 'image' ||
              req.destination === 'style' ||
              req.destination === 'script' ||
              req.destination === 'font')
          ) {
            const copy = res.clone();
            caches
              .open(RUNTIME_CACHE)
              .then((c) => c.put(req, copy))
              .catch(() => undefined);
          }
          return res;
        })
        .catch(() => cached);

      return cached || networkFetch;
    }),
  );
});
