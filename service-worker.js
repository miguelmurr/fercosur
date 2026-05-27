const CACHE_NAME = 'fercosur-cache-v1';

// Listado de archivos esenciales que el celular guardará en su memoria física
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './nuevo_logo.png',
  './nuevo_logoplanilla.png'
];

// 1. Evento de Instalación: Guarda los archivos en el disco duro del celular
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA: Almacenando interfaz y logos en el dispositivo...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Evento de Activación: Limpia memorias viejas si haces actualizaciones futuras
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('PWA: Limpiando caché obsoleta...');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Evento Fetch: Intercepta las pantallas y las abre instantáneamente sin señal
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones de Firebase Firestore (ellas se manejan solas con su propia persistencia)
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si el archivo está en la memoria del celular (HTML, Manifest, Logos), lo entrega ya mismo
        if (cachedResponse) {
          return cachedResponse;
        }
        // Si no está en la memoria (como una consulta nueva), lo busca en internet
        return fetch(event.request);
      })
  );
});