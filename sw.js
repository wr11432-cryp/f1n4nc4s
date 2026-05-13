// sw.js - Financial OS Service Worker
const CACHE_NAME = 'financial-os-v1.2';
const BASE_PATH = '/f1n4nc4s/proyecto';

const ASSETS_TO_CACHE = [
  BASE_PATH + '/',
  BASE_PATH + '/dashboard.html',
  BASE_PATH + '/transacciones.html',
  BASE_PATH + '/deudas.html',
  BASE_PATH + '/metas.html',
  BASE_PATH + '/data/database.js',
  BASE_PATH + '/manifest.json'
];

// Instalación
self.addEventListener('install', (event) => {
  console.log('📦 Instalando Service Worker en:', BASE_PATH);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📁 Cacheando recursos:', ASSETS_TO_CACHE);
        return cache.addAll(ASSETS_TO_CACHE).catch(error => {
          console.warn('⚠️ Algunos recursos no se pudieron cachear:', error);
          // Continuar aunque algunos fallen
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('✅ Instalación completada');
        return self.skipWaiting();
      })
  );
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('🔄 Activando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado y controlando páginas');
      return self.clients.claim();
    })
  );
});

// Estrategia de fetch: Network First con fallback a cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es exitosa, guardar en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde cache
        console.log('📱 Sirviendo desde cache:', event.request.url);
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || new Response('Recurso no disponible offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Mensajes
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('💪 Financial OS Service Worker listo en:', BASE_PATH);