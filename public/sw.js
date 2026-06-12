const CACHE_NAME = 'dipout-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/', '/index.html'])
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for API calls, cache-first for assets
  if (event.request.url.includes('/api/') || event.request.url.includes('base44.com')) {
    return; // Don't cache API requests
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
