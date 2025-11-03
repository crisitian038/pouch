const CACHE_NAME = 'tareas-pwa-v3'; // Cambia la versión
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/manifest.json',
  '/sw.js', // ¡IMPORTANTE! Agrega el service worker mismo
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
  // Solo maneja requests GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en cache, devuelve cache
        if (response) {
          return response;
        }
        
        // Si no está en cache, haz fetch y guarda en cache
        return fetch(event.request).then(fetchResponse => {
          // Verifica si la respuesta es válida
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }
          
          // Clona la respuesta
          const responseToCache = fetchResponse.clone();
          
          // Abre cache y guarda la nueva respuesta
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return fetchResponse;
        });
      })
      .catch(() => {
        // Si falla todo, podrías devolver una página offline
        return caches.match('/index.html');
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  // Limpia caches viejos
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
});
