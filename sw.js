const CACHE_NAME = 'gestion-stock-v1';
const urlsToCache = [
  '.',
  'index.html',
  'css/style.css',
  'js/script.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Installation du service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Récupération des fichiers (mode hors ligne)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Mise à jour du cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});
