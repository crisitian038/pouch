const CACHE_NAME = 'tareas-pwa-v2';
const urlsToCache = [
  './',
  './index.html',
  './main.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker instalándose');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Error en cache:', err);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devuelve el cache o hace fetch
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
});
