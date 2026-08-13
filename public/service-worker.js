const CACHE_VERSION = 'v2';
const CACHE_NAME = `ewindoore-${CACHE_VERSION}`;
const urlsToCache = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith('ewindoore-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isHtmlRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
  );
}

// HTML: network-first, cache olarak sadece offline yedek
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
      return response;
    })
    .catch(() => caches.match(request));
}

// Statik dosyalar: cache'den hemen yanit, arka planda ag ile guncelle
function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    })
  );
}

self.addEventListener('fetch', (event) => {
  // API isteklerini ve localhost dinamik sayfalarını Service Worker önbelleğine alma, direkt ağa yönlendir
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('localhost') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  if (isHtmlRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
