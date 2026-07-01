/* Electron PWA service worker — app-shell + split caches */
const CACHE = 'electron-shell-v4';
const ASSETS_CACHE = 'electron-assets-v1';
const IMAGES_CACHE = 'electron-images-v1';
const CURRENT_CACHES = new Set([CACHE, ASSETS_CACHE, IMAGES_CACHE]);

const SHELL = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/electron-logo-mark.png',
  '/pwa-screenshot-queue.svg',
  '/pwa-screenshot-memories.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !CURRENT_CACHES.has(k)).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for navigations so the app updates promptly when online.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  // Network-first for manifest.json (it can change).
  if (url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  // Cache-first (permanent) for content-hashed Vite JS/CSS chunks.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then((assetsCache) =>
        assetsCache.match(req).then(
          (cached) =>
            cached ||
            fetch(req).then((res) => {
              if (res.ok) assetsCache.put(req, res.clone()).catch(() => undefined);
              return res;
            }),
        ),
      ),
    );
    return;
  }

  // Cache-first for quiz photos — they never change.
  if (url.pathname.startsWith('/quiz-photos/')) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then((imgCache) =>
        imgCache.match(req).then(
          (cached) =>
            cached ||
            fetch(req).then((res) => {
              if (res.ok) imgCache.put(req, res.clone()).catch(() => undefined);
              return res;
            }),
        ),
      ),
    );
    return;
  }

  // Cache-first for static shell assets.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res.ok && (req.destination === 'image' || req.destination === 'style' || req.destination === 'script' || req.destination === 'font')) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
            }
            return res;
          })
          .catch(() => cached),
    ),
  );
});
