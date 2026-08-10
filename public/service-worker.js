const CACHE_NAME = 'ewindoore-v1';
const urlsToCache = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // API isteklerini ve localhost dinamik sayfalarını Service Worker önbelleğine alma, direkt ağa yönlendir
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('localhost') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});