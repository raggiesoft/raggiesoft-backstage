/**
 * @license MIT
 * ============================================================================
 * sw.js — Tiered Progressive Web App Service Worker for backstage.raggiesoft.com
 * ============================================================================
 * Caching Strategy:
 * 1. HTML Navigations (`request.mode === 'navigate'`): NetworkFirst (always
 *    serves the freshest application shell online, falling back to cache offline).
 * 2. JSON Companion API (`/api/v1/*.json`): StaleWhileRevalidate.
 * 3. Versioned Same-Origin Assets (`/assets/*`, `/icons/*`): CacheFirst.
 * ============================================================================
 */
const CACHE_NAME = 'raggiesoft-backstage-v20261115a';
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/favicon.ico?v=20261115a",
  "/icons/icon.svg?v=20261115a",
  "/icons/icon-192.png?v=20261115a",
  "/icons/icon-512.png?v=20261115a",
  "/icons/apple-icon-180.png?v=20261115a",
  "/assets/backstage.css?v=20261115a",
  "/assets/backstage-client.js?v=20261115a",
  "/api/v1/index.json",
  "/books/aubrie",
  "/books/rachel",
  "/books/katie",
  "/locations/cpi",
  "/music/stardust-engine-origins",
  "/books/rachel/david-miller-precinct-interview-and-warehouse-raid",
  "/books/rachel/the-bug-and-bear-dynamic-and-base-camp-protocols",
  "/books/rachel/confidential-school-nurse-briefing-and-tiered-iep-addenda",
  "/books/rachel/seonduwon-diplomatic-shield-and-pamyun-verdict",
  "/books/rachel/the-wingman-briefing-ashley-and-bonnie",
  "/books/rachel/black-friday-1999-and-toms-two-am-christmas-drop",
  "/books/rachel/sloanes-punishment-and-the-brigadoon-rumor-sabotage",
  "/books/katie/sunward-tropics-divorce-and-maiden-name-order",
  "/corporations/vectron-question-the-rules",
  "/books/katie/cbsa-windsor-tunnel-refusal-and-marshals-file",
  "/books/katie/christmas-2004-tonomy-hill-and-williamsburg-what-if",
  "/books/rachel/the-quantum-dossier-jessica-progman-and-william-keswick",
  "/books/katie/rrc-staff-file-voc-eval-and-level-1-contract",
  "/books/katie/rrc-seasonal-closet-curfew-search",
  "/books/katie/rrc-dorm-database-hack-and-coverup",
  "/books/rachel/canadian-arch-sanctuary-anchor-rotation-and-lynnhaven-seondu",
  "/books/katie/mayor-overton-newtown-road-and-2010-dietz-meltdown",
  "/books/aubrie/correspondence/the-accommodation-file",
  "/books/aubrie/correspondence/the-counselors-note",
  "/books/aubrie/correspondence/early-check-in-rounds",
  "/books/aubrie/isabel-pov-notes",
  "/books/aubrie/correspondence/the-clerical-error-file",
  "/books/aubrie/correspondence/the-fourteen-day-floor-reports",
  "/books/aubrie/correspondence/the-good-faith-accord",
  "/books/aubrie/correspondence/the-joint-administrative-complaint",
  "/books/aubrie/correspondence/the-bureaucratic-firewall",
  "/books/aubrie/correspondence/the-mitigating-factor",
  "/books/aubrie/correspondence/fifty-eight-seconds",
  "/books/aubrie/zoe-logging-architecture",
  "/books/katie/hb-663-majority-leader-hawkins-postmortem",
  "/books/katie/hillside-court-six-oclock-news-and-holding-the-elevator",
  "/books/katie/room-518-house-page-triplets-and-uncle-richard",
  "/books/rachel/code-susquehanna-and-the-bear-and-bug-vault",
  "/books/katie/dscc-holloway-primary-and-senate-wheelchair-caucus",
  "/books/katie/dirksen-room-511-sterling-and-cross-panic",
  "/books/katie/brenda-walsh-suite-756-and-the-2044-route-15-primary",
  "/books/katie/arthur-lawrence-fishersville-audit-and-five-oclock-resignations",
  "/books/katie/governor-langford-capitol-square-reckoning-with-sterling",
  "/api/v1/books/aubrie.json",
  "/api/v1/books/rachel.json",
  "/api/v1/books/katie.json",
  "/api/v1/locations/cpi.json",
  "/api/v1/music/stardust-engine-origins.json",
  "/api/v1/books/rachel/david-miller-precinct-interview-and-warehouse-raid.json",
  "/api/v1/books/rachel/the-bug-and-bear-dynamic-and-base-camp-protocols.json",
  "/api/v1/books/rachel/confidential-school-nurse-briefing-and-tiered-iep-addenda.json",
  "/api/v1/books/rachel/seonduwon-diplomatic-shield-and-pamyun-verdict.json",
  "/api/v1/books/rachel/the-wingman-briefing-ashley-and-bonnie.json",
  "/api/v1/books/rachel/black-friday-1999-and-toms-two-am-christmas-drop.json",
  "/api/v1/books/rachel/sloanes-punishment-and-the-brigadoon-rumor-sabotage.json",
  "/api/v1/books/katie/sunward-tropics-divorce-and-maiden-name-order.json",
  "/api/v1/corporations/vectron-question-the-rules.json",
  "/api/v1/books/katie/cbsa-windsor-tunnel-refusal-and-marshals-file.json",
  "/api/v1/books/katie/christmas-2004-tonomy-hill-and-williamsburg-what-if.json",
  "/api/v1/books/rachel/the-quantum-dossier-jessica-progman-and-william-keswick.json",
  "/api/v1/books/katie/rrc-staff-file-voc-eval-and-level-1-contract.json",
  "/api/v1/books/katie/rrc-seasonal-closet-curfew-search.json",
  "/api/v1/books/katie/rrc-dorm-database-hack-and-coverup.json",
  "/api/v1/books/rachel/canadian-arch-sanctuary-anchor-rotation-and-lynnhaven-seondu.json",
  "/api/v1/books/katie/mayor-overton-newtown-road-and-2010-dietz-meltdown.json",
  "/api/v1/books/aubrie/correspondence/the-accommodation-file.json",
  "/api/v1/books/aubrie/correspondence/the-counselors-note.json",
  "/api/v1/books/aubrie/correspondence/early-check-in-rounds.json",
  "/api/v1/books/aubrie/isabel-pov-notes.json",
  "/api/v1/books/aubrie/correspondence/the-clerical-error-file.json",
  "/api/v1/books/aubrie/correspondence/the-fourteen-day-floor-reports.json",
  "/api/v1/books/aubrie/correspondence/the-good-faith-accord.json",
  "/api/v1/books/aubrie/correspondence/the-joint-administrative-complaint.json",
  "/api/v1/books/aubrie/correspondence/the-bureaucratic-firewall.json",
  "/api/v1/books/aubrie/correspondence/the-mitigating-factor.json",
  "/api/v1/books/aubrie/correspondence/fifty-eight-seconds.json",
  "/api/v1/books/aubrie/zoe-logging-architecture.json",
  "/api/v1/books/katie/hb-663-majority-leader-hawkins-postmortem.json",
  "/api/v1/books/katie/hillside-court-six-oclock-news-and-holding-the-elevator.json",
  "/api/v1/books/katie/room-518-house-page-triplets-and-uncle-richard.json",
  "/api/v1/books/rachel/code-susquehanna-and-the-bear-and-bug-vault.json",
  "/api/v1/books/katie/dscc-holloway-primary-and-senate-wheelchair-caucus.json",
  "/api/v1/books/katie/dirksen-room-511-sterling-and-cross-panic.json",
  "/api/v1/books/katie/brenda-walsh-suite-756-and-the-2044-route-15-primary.json",
  "/api/v1/books/katie/arthur-lawrence-fishersville-audit-and-five-oclock-resignations.json",
  "/api/v1/books/katie/governor-langford-capitol-square-reckoning-with-sterling.json"
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
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname === '/robots.txt' ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/404.html' ||
    url.pathname.endsWith('.txt')
  ) {
    return;
  }

  // 1. HTML Documents: NetworkFirst for instant content freshness + offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // 2. JSON Companion API: StaleWhileRevalidate
  if (url.pathname.startsWith('/api/v1/')) {
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
    return;
  }

  // 3. Static Versioned Assets & Icons: CacheFirst
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
