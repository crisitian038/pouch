const CACHE_NAME = 'tareas-pwa-v1';
const urlsToCache = [
  '/',
  './index.html',
  './main.js',
  'https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});