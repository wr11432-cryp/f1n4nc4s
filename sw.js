// Financial OS - Service Worker
const CACHE_NAME = 'financial-os-v1.2';
const BASE_PATH = '/f1n4nc4s/proyecto';

const ASSETS_TO_CACHE = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/dashboard.html',
  BASE_PATH + '/transacciones.html',
  BASE_PATH + '/deudas.html',
  BASE_PATH + '/metas.html',
  BASE_PATH + '/data/database.js',
  BASE_PATH + '/manifest.json'
];

// Instalación
self.addEventListener('install', (event) => {
  console.log('📦 Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📁 Cacheando recursos');
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => 
            cache.add(url).catch(err => {
              console.warn('⚠️ No se pudo cachear:', url, err);
            })
          )
        );
      })
      .then(() => {
        console.log('✅ Instalación completada');
        return self.skipWaiting();
      })
  );
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estrategia: Network First con fallback a cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback offline
          if (event.request.mode === 'navigate') {
            return caches.match(BASE_PATH + '/dashboard.html');
          }
          return new Response('No disponible offline', { status: 503 });
        });
      })
  );
});

// Manejar mensajes
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});