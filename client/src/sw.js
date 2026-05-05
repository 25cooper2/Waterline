// Cache version — bump this on every deploy so old caches get cleared.
// The Vite build plugin appends a timestamp, so this always changes.
const CACHE_VERSION = '__BUILD_TIME__';
const CACHE_NAME = 'waterline-' + CACHE_VERSION;

// Never cache these — always go to network
const NEVER_CACHE = [
  '/index.html',
  '/sw.js',
  '/manifest.json',
];

function shouldCache(url) {
  const u = new URL(url);
  // Don't cache API calls
  if (u.pathname.startsWith('/api')) return false;
  // Don't cache navigation (HTML)
  if (NEVER_CACHE.some(p => u.pathname === p || u.pathname === '/')) return false;
  // Cache static assets (JS, CSS, images, fonts)
  return true;
}

self.addEventListener('install', (event) => {
  console.log('[SW] Installing', CACHE_NAME);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // Tell all open tabs a new version is active
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'UPDATE_AVAILABLE' });
        });
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Navigation requests (HTML) — always go to network, fall back to cache
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // API calls — network only
  if (url.pathname.startsWith('/api')) return;

  // Static assets — cache-first with background update
  if (shouldCache(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type !== 'error') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
});
