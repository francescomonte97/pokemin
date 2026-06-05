const POKEMIN_CACHE = 'pokemin-pwa-v10';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './css/css2.css',
  './font/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2',
  './js/data.js',
  './js/map.js',
  './js/battle.js',
  './js/ui.js',
  './js/endless.js',
  './js/cloud-save.js',
  './js/firebase-player-registry.js',
  './js/pwa.js',
  './js/game.js',
  './data/pokedex.json',
  './ui/background.jpg',
  './ui/pokedex.png',
  './ui/settings.png',
  './ui/achievements.png',
  './ui/lock.png',
  './ui/battleBase.png',
  './ui/battleBackground.png',
  './ui/icons/app-icon-180.png',
  './ui/icons/app-icon-192.png',
  './ui/icons/app-icon-512.png',
  './ui/icons/app-icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(POKEMIN_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== POKEMIN_CACHE)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/data/pokedex.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(POKEMIN_CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => {
        const copy = response.clone();
        caches.open(POKEMIN_CACHE).then(cache => cache.put(request, copy));
        return response;
      }))
  );
});
