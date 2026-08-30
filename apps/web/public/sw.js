/* Electron PWA service worker — app-shell, movie queue & offline caching strategy */
const CACHE_VERSION = 'v11';
const STATIC_CACHE = `electron-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `electron-runtime-${CACHE_VERSION}`;
const DATA_CACHE = `electron-data-${CACHE_VERSION}`;
const MEDIA_CACHE = `electron-media-${CACHE_VERSION}`;

const CURRENT_CACHES = [STATIC_CACHE, RUNTIME_CACHE, DATA_CACHE, MEDIA_CACHE];

// Pre-cached assets for full offline PWA shell and manifest support
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/electron-logo-mark.png',
  '/aaron-avatar.png',
  '/electra-button.png',
  '/pwa-screenshot-queue.svg',
  '/opengraph.jpg',
];

// Max entries for caches to prevent storage exhaustion
const RUNTIME_CACHE_MAX_ENTRIES = 80;
const MEDIA_CACHE_MAX_ENTRIES = 200;
const DATA_CACHE_MAX_ENTRIES = 40;

// Domains allowed for cross-origin image & poster caching
const ALLOWED_MEDIA_HOSTS = [
  'm.media-amazon.com',
  'images.unsplash.com',
  'ia.media-imdb.com',
  'cataas.com',
  'api.tvmaze.com',
  'static.tvmaze.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch((err) => {
        console.warn('[SW] Pre-caching shell assets non-fatal error:', err);
      })
      .finally(() => {
        // Clear previous runtime cache on install to avoid stale artifacts
        return caches.delete(RUNTIME_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !CURRENT_CACHES.includes(k))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

/**
 * Trim cache to prevent storage bloat on long-lived installations (FIFO eviction).
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const toDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(toDelete.map((req) => cache.delete(req)));
    }
  } catch {
    // Ignore trim errors
  }
}

/**
 * Determine if a request represents a movie poster, memory photo, or media asset.
 */
function isMediaRequest(req, url) {
  if (req.destination === 'image') return true;
  if (ALLOWED_MEDIA_HOSTS.some((host) => url.hostname.includes(host))) return true;
  if (
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|avif)(\?.*)?$/i) &&
    !url.pathname.startsWith('/src/')
  ) {
    return true;
  }
  return false;
}

/**
 * Determine if a request is for web font assets.
 */
function isFontRequest(req, url) {
  if (req.destination === 'font') return true;
  if (
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.pathname.match(/\.(woff|woff2|ttf|eot|otf)(\?.*)?$/i)
  ) {
    return true;
  }
  return false;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Bypass dev server internal and hot-reload paths
  if (url.pathname.startsWith('/src/')) return;
  if (url.pathname.startsWith('/@vite/')) return;
  if (url.pathname.startsWith('/@react-refresh')) return;
  if (url.pathname.startsWith('/node_modules/')) return;

  // 1. Navigation requests (PWA shortcuts, page reload, routing) -> Network-first with static cache fallback
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches
              .open(STATIC_CACHE)
              .then((c) => c.put('/index.html', copy))
              .catch(() => undefined);
          }
          return res;
        })
        .catch(async () => {
          const cached =
            (await caches.match('/index.html')) ||
            (await caches.match('/')) ||
            (await caches.match(req));
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Electron (Offline)</title></head><body><h2>Offline</h2><p>Please reconnect to the internet.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }),
    );
    return;
  }

  // 2. Data API requests (/api/state/movies, /api/state/memories, etc.) -> Network-first with DATA_CACHE fallback
  if (url.pathname.startsWith('/api/state/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches
              .open(DATA_CACHE)
              .then((cache) => {
                cache.put(req, copy);
                trimCache(DATA_CACHE, DATA_CACHE_MAX_ENTRIES);
              })
              .catch(() => undefined);
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) {
            // Return cached data with custom header indicating offline state fallback
            const headers = new Headers(cached.headers);
            headers.set('X-Electron-From-Cache', 'true');
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers,
            });
          }
          return new Response(
            JSON.stringify({
              data: null,
              version: 'offline-cache-miss',
              degraded: true,
              warning: "You're offline — changes stay on this device until you're back online.",
            }),
            {
              status: 503,
              statusText: 'Service Unavailable (Offline)',
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }),
    );
    return;
  }

  // 2.5 Metadata API requests (/api/omdb, /api/tvmaze) -> Stale-while-revalidate with DATA_CACHE
  if (url.pathname.startsWith('/api/omdb') || url.pathname.startsWith('/api/tvmaze')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches
                .open(DATA_CACHE)
                .then((cache) => {
                  cache.put(req, copy);
                  // Increase max entries for data cache since metadata can be numerous
                  trimCache(DATA_CACHE, Math.max(DATA_CACHE_MAX_ENTRIES, 150));
                })
                .catch(() => undefined);
            }
            return res;
          })
          .catch(() => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ error: 'Offline', Error: 'Offline' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        return cached || fetchPromise;
      }),
    );
    return;
  }

  // Other non-state /api routes (e.g. search, streaming, auth) bypass SW caching
  if (url.pathname.startsWith('/api/')) return;

  // 3. Movie Posters, Saved Memory Images & Media -> Cache-first / Stale-While-Revalidate with Opaque Support
  if (isMediaRequest(req, url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res.ok || res.type === 'opaque') {
              const copy = res.clone();
              caches
                .open(MEDIA_CACHE)
                .then((cache) => {
                  cache.put(req, copy);
                  trimCache(MEDIA_CACHE, MEDIA_CACHE_MAX_ENTRIES);
                })
                .catch(() => undefined);
            }
            return res;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      }),
    );
    return;
  }

  // 4. Web Fonts & Google Fonts -> Stale-while-revalidate in RUNTIME_CACHE
  if (isFontRequest(req, url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res.ok || res.type === 'opaque') {
              const copy = res.clone();
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.put(req, copy))
                .catch(() => undefined);
            }
            return res;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      }),
    );
    return;
  }

  // 5. Hashed application bundles (/assets/*) -> Cache-first
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

  // 6. Other same-origin static resources -> Stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
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
          })
          .catch(() => cached);

        return cached || networkFetch;
      }),
    );
  }
});

// Communication channel with client for warming poster/memory caches and skip waiting
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Pre-warm movie poster & memory image URLs for offline readiness
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const uniqueUrls = Array.from(
          new Set(
            data.urls.filter(
              (u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))
            )
          )
        );

        for (const targetUrl of uniqueUrls) {
          try {
            const existing = await cache.match(targetUrl);
            if (!existing) {
              const res = await fetch(targetUrl, { mode: 'no-cors' });
              if (res.ok || res.type === 'opaque') {
                await cache.put(targetUrl, res);
              }
            }
          } catch {
            // Ignore pre-warming fetch errors for individual assets
          }
        }
        trimCache(MEDIA_CACHE, MEDIA_CACHE_MAX_ENTRIES);
      })
    );
  }
});

