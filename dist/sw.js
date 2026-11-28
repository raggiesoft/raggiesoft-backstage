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
const CACHE_NAME = 'raggiesoft-backstage-v20261121e';
const PRECACHE_URLS = [
  "/",
  "/favicon.ico?v=20261121e",
  "/icons/icon.svg?v=20261121e",
  "/icons/icon-192.png?v=20261121e",
  "/icons/icon-512.png?v=20261121e",
  "/icons/apple-icon-180.png?v=20261121e",
  "/assets/backstage.css?v=20261121e",
  "/assets/backstage-client.js?v=20261121e",
  "/api/v1/index.json",
  "/api/v1/story-arcs.json",
  "/arcs",
  "/arcs/aubrie-room-214-and-isabels-firewall",
  "/arcs/aubrie-world-trek-and-zoes-architecture",
  "/arcs/heather-scales-tails-and-safe-people",
  "/arcs/katie-heather-wesley-and-virginia",
  "/arcs/katie-katie-political-career",
  "/arcs/katie-brittany-chelsea-and-the-four-person-sanctuary",
  "/arcs/katie-fishersville-twelve-days-and-twenty-years",
  "/arcs/quantum-directive-3-casey-twenty-one-day-bridge-and-holiday-sanctuary",
  "/arcs/quantum-directive-3-casey-sovereign-ceo-and-senate-witness-table",
  "/arcs/rachel-bear-and-bug-to-code-susquehanna",
  "/arcs/rachel-open-roads-and-mountain-conferences",
  "/arcs/stardust-engine-apex-records-to-engine-room-independence",
  "/arcs/stardust-engine-reignition-and-live-at-the-crucible",
  "/books/quantum-directive-3-casey",
  "/books/aubrie",
  "/books/rachel",
  "/books/katie",
  "/locations/cpi",
  "/music/stardust-engine-origins",
  "/books/rachel/david-miller-precinct-interview-and-warehouse-raid",
  "/books/rachel/the-bug-and-bear-dynamic-and-base-camp-protocols",
  "/books/rachel/confidential-school-nurse-briefing-and-tiered-iep-addenda",
  "/books/rachel/seonduwon-diplomatic-shield-and-pamyun-verdict",
  "/books/quantum-directive-3-casey/catalyst-judging-room-and-the-disabled-486-rig",
  "/books/rachel/the-wingman-briefing-ashley-and-bonnie",
  "/books/rachel/black-friday-1999-and-toms-two-am-christmas-drop",
  "/books/rachel/sloanes-punishment-and-the-brigadoon-rumor-sabotage",
  "/books/waystation/the-turned-off-meter-denises-cab-from-monticello-avenue",
  "/books/waystation/from-monticello-to-pasco-why-there-were-no-family-restrooms",
  "/books/katie/sunward-tropics-divorce-and-maiden-name-order",
  "/corporations/vectron-question-the-rules",
  "/books/waystation/ray-halsteads-two-telephone-references-for-cchr",
  "/books/waystation/the-admiral-center-escalator-blindspot-and-section-18-2-387",
  "/books/waystation/the-paused-vcr-clock-and-two-world-time",
  "/books/katie/what-if-brittany-respected-no-company-new-years-2002",
  "/books/katie/wesley-blowout-at-heather-losing-his-friend-nate",
  "/books/katie/room-204-unhandled-exception-and-tylers-cousin-lie",
  "/books/katie/what-if-virginia-domicile-unbroken-trust-and-both-rescues",
  "/books/luna-leo/what-if-luna-threw-delores-out-during-sibling-weekend",
  "/books/katie/cbsa-windsor-tunnel-refusal-and-marshals-file",
  "/books/quantum-directive-3-casey/twenty-one-day-firewall-and-mount-hope-reveillon-permit",
  "/books/katie/christmas-2004-tonomy-hill-and-williamsburg-what-if",
  "/books/quantum-directive-3-casey/milepost-138-threat-dossier-and-form-709-clean-ledger",
  "/books/rachel/the-quantum-dossier-jessica-progman-and-william-keswick",
  "/books/rachel/canadian-arch-sanctuary-anchor-rotation-and-lynnhaven-seondu",
  "/books/katie/rrc-staff-file-voc-eval-and-level-1-contract",
  "/books/katie/rrc-seasonal-closet-curfew-search",
  "/books/katie/rrc-dorm-database-hack-and-coverup",
  "/books/katie/what-if-rrc-unlocked-closet-ending-a-wesley-breaks-the-door",
  "/books/katie/what-if-rrc-unlocked-closet-ending-b-three-fifty-am",
  "/books/katie/what-if-rrc-unlocked-closet-ending-c-six-forty-am-stealth",
  "/books/katie/mayor-overton-newtown-road-and-2010-dietz-meltdown",
  "/books/quantum-directive-3-casey/eighteen-minutes-in-building-33-and-the-orange-badge-override",
  "/books/quantum-directive-3-casey/meridian-obsidian-ruby-mountain-airlift-and-courtyard-protocol",
  "/books/quantum-directive-3-casey/k-street-motorcade-meltdown-and-the-fenwick-bridge-bypass",
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
  "/books/katie/wesley-sees-katie-on-tv-and-cautious-grid-request",
  "/books/katie/chelsea-and-wesley-at-the-turtle-lagoon",
  "/books/katie/north-lion-scales-and-tails-floorplan-and-animal-wings",
  "/books/katie/what-if-minnesota-marriage-and-the-unrescued-cousins",
  "/books/rachel/code-susquehanna-and-the-bear-and-bug-vault",
  "/books/katie/dscc-holloway-primary-and-senate-wheelchair-caucus",
  "/books/katie/dirksen-room-511-sterling-and-cross-panic",
  "/books/katie/brenda-walsh-suite-756-and-the-2044-route-15-primary",
  "/books/katie/arthur-lawrence-fishersville-audit-and-five-oclock-resignations",
  "/books/katie/governor-langford-capitol-square-reckoning-with-sterling",
  "/books/katie/what-if-wesley-and-chelsea-two-in-law-suites",
  "/api/v1/books/quantum-directive-3-casey.json",
  "/api/v1/books/aubrie.json",
  "/api/v1/books/rachel.json",
  "/api/v1/books/katie.json",
  "/api/v1/locations/cpi.json",
  "/api/v1/music/stardust-engine-origins.json",
  "/api/v1/books/rachel/david-miller-precinct-interview-and-warehouse-raid.json",
  "/api/v1/books/rachel/the-bug-and-bear-dynamic-and-base-camp-protocols.json",
  "/api/v1/books/rachel/confidential-school-nurse-briefing-and-tiered-iep-addenda.json",
  "/api/v1/books/rachel/seonduwon-diplomatic-shield-and-pamyun-verdict.json",
  "/api/v1/books/quantum-directive-3-casey/catalyst-judging-room-and-the-disabled-486-rig.json",
  "/api/v1/books/rachel/the-wingman-briefing-ashley-and-bonnie.json",
  "/api/v1/books/rachel/black-friday-1999-and-toms-two-am-christmas-drop.json",
  "/api/v1/books/rachel/sloanes-punishment-and-the-brigadoon-rumor-sabotage.json",
  "/api/v1/books/waystation/the-turned-off-meter-denises-cab-from-monticello-avenue.json",
  "/api/v1/books/waystation/from-monticello-to-pasco-why-there-were-no-family-restrooms.json",
  "/api/v1/books/katie/sunward-tropics-divorce-and-maiden-name-order.json",
  "/api/v1/corporations/vectron-question-the-rules.json",
  "/api/v1/books/waystation/ray-halsteads-two-telephone-references-for-cchr.json",
  "/api/v1/books/waystation/the-admiral-center-escalator-blindspot-and-section-18-2-387.json",
  "/api/v1/books/waystation/the-paused-vcr-clock-and-two-world-time.json",
  "/api/v1/books/katie/what-if-brittany-respected-no-company-new-years-2002.json",
  "/api/v1/books/katie/wesley-blowout-at-heather-losing-his-friend-nate.json",
  "/api/v1/books/katie/room-204-unhandled-exception-and-tylers-cousin-lie.json",
  "/api/v1/books/katie/what-if-virginia-domicile-unbroken-trust-and-both-rescues.json",
  "/api/v1/books/luna-leo/what-if-luna-threw-delores-out-during-sibling-weekend.json",
  "/api/v1/books/katie/cbsa-windsor-tunnel-refusal-and-marshals-file.json",
  "/api/v1/books/quantum-directive-3-casey/twenty-one-day-firewall-and-mount-hope-reveillon-permit.json",
  "/api/v1/books/katie/christmas-2004-tonomy-hill-and-williamsburg-what-if.json",
  "/api/v1/books/quantum-directive-3-casey/milepost-138-threat-dossier-and-form-709-clean-ledger.json",
  "/api/v1/books/rachel/the-quantum-dossier-jessica-progman-and-william-keswick.json",
  "/api/v1/books/rachel/canadian-arch-sanctuary-anchor-rotation-and-lynnhaven-seondu.json",
  "/api/v1/books/katie/rrc-staff-file-voc-eval-and-level-1-contract.json",
  "/api/v1/books/katie/rrc-seasonal-closet-curfew-search.json",
  "/api/v1/books/katie/rrc-dorm-database-hack-and-coverup.json",
  "/api/v1/books/katie/what-if-rrc-unlocked-closet-ending-a-wesley-breaks-the-door.json",
  "/api/v1/books/katie/what-if-rrc-unlocked-closet-ending-b-three-fifty-am.json",
  "/api/v1/books/katie/what-if-rrc-unlocked-closet-ending-c-six-forty-am-stealth.json",
  "/api/v1/books/katie/mayor-overton-newtown-road-and-2010-dietz-meltdown.json",
  "/api/v1/books/quantum-directive-3-casey/eighteen-minutes-in-building-33-and-the-orange-badge-override.json",
  "/api/v1/books/quantum-directive-3-casey/meridian-obsidian-ruby-mountain-airlift-and-courtyard-protocol.json",
  "/api/v1/books/quantum-directive-3-casey/k-street-motorcade-meltdown-and-the-fenwick-bridge-bypass.json",
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
  "/api/v1/books/katie/wesley-sees-katie-on-tv-and-cautious-grid-request.json",
  "/api/v1/books/katie/chelsea-and-wesley-at-the-turtle-lagoon.json",
  "/api/v1/books/katie/north-lion-scales-and-tails-floorplan-and-animal-wings.json",
  "/api/v1/books/katie/what-if-minnesota-marriage-and-the-unrescued-cousins.json",
  "/api/v1/books/rachel/code-susquehanna-and-the-bear-and-bug-vault.json",
  "/api/v1/books/katie/dscc-holloway-primary-and-senate-wheelchair-caucus.json",
  "/api/v1/books/katie/dirksen-room-511-sterling-and-cross-panic.json",
  "/api/v1/books/katie/brenda-walsh-suite-756-and-the-2044-route-15-primary.json",
  "/api/v1/books/katie/arthur-lawrence-fishersville-audit-and-five-oclock-resignations.json",
  "/api/v1/books/katie/governor-langford-capitol-square-reckoning-with-sterling.json",
  "/api/v1/books/katie/what-if-wesley-and-chelsea-two-in-law-suites.json"
];

// Lifecycle Phase 1 ('install'): Pre-populate Cache Storage with all routes & assets,
// then call 'self.skipWaiting()' so updated Service Workers activate without waiting for tabs to close.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

// Lifecycle Phase 2 ('activate'): Delete outdated cache buckets from older ASSET_VERSION builds
// and call 'self.clients.claim()' to take immediate control of open Backstage windows.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Lifecycle Phase 3 ('fetch'): Intercept same-origin GET requests and apply tiered caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Let crawler/manifest/verification endpoints hit Nginx directly without SW interception
  if (
    url.pathname === '/manifest.json' ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/404.html' ||
    url.pathname.endsWith('.txt')
  ) {
    return;
  }

  // Tier 1 — HTML Documents: NetworkFirst for instant content freshness + offline fallback
  // Note: Response streams can only be consumed ONCE, so 'response.clone()' duplicates the stream
  // before writing one copy to Cache Storage and returning the other copy to the browser!
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

  // Tier 2 — JSON Companion API: StaleWhileRevalidate (returns cached JSON immediately if present
  // while refreshing the cache in the background for next time)
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

  // Tier 3 — Static Versioned Assets & Icons ('?v=ASSET_VERSION'): CacheFirst for zero-latency hits
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
