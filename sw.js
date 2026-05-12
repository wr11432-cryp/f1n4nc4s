// sw.js
const CACHE_NAME = 'financial-os-v1.0';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard.html',
  '/transacciones.html',
  '/deudas.html',
  '/metas.html',
  '/data/database.js',
  '/manifest.json'
];

// Instalación - Cachear archivos esenciales
self.addEventListener('install', (event) => {
  console.log('📦 Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📁 Cacheando archivos');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error en instalación:', error);
      })
  );
});

// Activación - Limpiar caches viejos
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
      console.log('✅ Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Estrategia: Network First (Primero red, luego cache)
self.addEventListener('fetch', (event) => {
  // Solo interceptar requests GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardarla en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si no hay red, buscar en cache
        console.log('📱 Sin conexión, usando cache para:', event.request.url);
        return caches.match(event.request);
      })
  );
});

// Manejar mensajes
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('💪 Service Worker registrado correctamente');