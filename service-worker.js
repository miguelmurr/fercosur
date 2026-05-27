const CACHE_NAME = 'fercosur-cache-auto';

// Archivos iniciales esenciales para el arranque de la aplicación
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './nuevo_logo.png',
  './nuevo_logoplanilla.png'
  './logo_app.png'
];

// 1. Instalación: Guarda la base inicial en el disco duro del celular
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA: Guardando base inicial en el dispositivo...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activación: Toma el control inmediato de la aplicación
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Interceptador Inteligente: Muestra lo guardado, pero actualiza en segundo plano
self.addEventListener('fetch', (event) => {
  // Ignorar consultas directas a la base de datos de Firebase Firestore
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        
        // Creamos la consulta a internet en segundo plano
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Si internet responde bien, guardamos una copia fresca en la memoria local
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Si falla internet (Modo Avión), no pasa nada, se ignora el error en silencio
        });

        // REGLA DE ORO AUTOMÁTICA: 
        // Si el archivo está memorizado (HTML, logos, etc.), lo entrega YA.
        // Si no está memorizado, espera la respuesta de internet.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
