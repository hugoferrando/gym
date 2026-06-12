// Service worker — Hugo Salle
// Incrémente CACHE_VERSION à chaque déploiement pour forcer la mise à jour.
const CACHE_VERSION = 'hugo-salle-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stratégie : réseau d'abord pour la page (pour récupérer les mises à jour),
// repli sur le cache si hors-ligne. Cache d'abord pour le reste.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const isNavigation = e.request.mode === 'navigate' || e.request.destination === 'document';
  if (isNavigation) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
        return res;
      }))
    );
  }
});
