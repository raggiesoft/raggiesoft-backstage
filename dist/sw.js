/**
 * @license MIT
 * sw.js — Offline-First Progressive Web App Service Worker for backstage.raggiesoft.com
 */
const CACHE_NAME = 'raggiesoft-backstage-v20261024a';
const PRECACHE_URLS = [
  "/",
  "/assets/backstage.css?v=20261024a",
  "/assets/backstage-client.js?v=20261024a",
  "/api/v1/index.json",
  "/books/aubrie/correspondence/early-check-in-rounds",
  "/books/aubrie/correspondence/fifty-eight-seconds",
  "/books/aubrie/correspondence/the-accommodation-file",
  "/books/aubrie/correspondence/the-bureaucratic-firewall",
  "/books/aubrie/correspondence/the-clerical-error-file",
  "/books/aubrie/correspondence/the-counselors-note",
  "/books/aubrie/correspondence/the-fourteen-day-floor-reports",
  "/books/aubrie/correspondence/the-good-faith-accord",
  "/books/aubrie/correspondence/the-joint-administrative-complaint",
  "/books/aubrie/correspondence/the-mitigating-factor",
  "/books/aubrie",
  "/books/aubrie/isabel-pov-notes",
  "/books/aubrie/zoe-logging-architecture",
  "/corporations/vectron-question-the-rules",
  "/locations/cpi",
  "/music/stardust-engine-origins",
  "/api/v1/books/aubrie/correspondence/early-check-in-rounds.json",
  "/api/v1/books/aubrie/correspondence/fifty-eight-seconds.json",
  "/api/v1/books/aubrie/correspondence/the-accommodation-file.json",
  "/api/v1/books/aubrie/correspondence/the-bureaucratic-firewall.json",
  "/api/v1/books/aubrie/correspondence/the-clerical-error-file.json",
  "/api/v1/books/aubrie/correspondence/the-counselors-note.json",
  "/api/v1/books/aubrie/correspondence/the-fourteen-day-floor-reports.json",
  "/api/v1/books/aubrie/correspondence/the-good-faith-accord.json",
  "/api/v1/books/aubrie/correspondence/the-joint-administrative-complaint.json",
  "/api/v1/books/aubrie/correspondence/the-mitigating-factor.json",
  "/api/v1/books/aubrie.json",
  "/api/v1/books/aubrie/isabel-pov-notes.json",
  "/api/v1/books/aubrie/zoe-logging-architecture.json",
  "/api/v1/corporations/vectron-question-the-rules.json",
  "/api/v1/locations/cpi.json",
  "/api/v1/music/stardust-engine-origins.json"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
