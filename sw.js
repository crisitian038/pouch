const CACHE_NAME = 'tareas-pwa-v3';
const urlsToCache = [
  './',
  './index.html',
  './main.js',
  './manifest.json',
  './sw.js',
  './404.html',
  './images/192.png',
  './images/512.png',
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
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en cache, devolverlo
        if (response) {
          return response;
        }
        
        // Si no está en cache, hacer fetch
        return fetch(event.request).then(fetchResponse => {
          // Si la respuesta no es válida, devolverla tal cual
          if (!fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }
          
          // Guardar en cache para próximas requests
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return fetchResponse;
        }).catch(() => {
          // Si falla la red, servir index.html como fallback
          return caches.match('./index.html');
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
