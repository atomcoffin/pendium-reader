// =====================================================================
// IMPORTANT — RELEASE PROCESS
// Bump CACHE_VERSION on EVERY meaningful release. The version string is
// the cache key — if it doesn't change, returning users get the old
// cached HTML/CSS/JS until they manually clear cache. The activate
// handler below deletes any cache whose key doesn't match this version.
// Add new assets (fonts, icons) to ASSETS so they're cached on install.
// =====================================================================
const CACHE_VERSION = 'tomen-v1.15.4-debug';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './fonts/Thow0.3-Regular.woff2',
  './fonts/Thow0.3-Italic.woff2',
  './fonts/Thow0.3-Medium.woff2',
  './fonts/Thow0.3-SemiBold.woff2',
  './fonts/ThowMono0.3-Regular.woff2',
  './fonts/Siche-Text-v.0.3-Regular.woff2',
  './fonts/Siche-Text-v.0.3-Regular-Italic.woff2',
  './fonts/Siche-Display-v.0.3-Regular.woff2',
  './fonts/Siche-Display-v.0.3-Regular-Italic.woff2',
  './fonts/UncutSans-Variable.woff2',
  './fonts/DolphYY-Regular.woff2',
  './fonts/DolphYY-RegularItalic.woff2',
  './fonts/DolphYY-Bold.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

self.addEventListener('install', (event) => {
  // addAll fails the whole batch if any single asset fails. Use Promise.all
  // over individual cache.add calls so a missing/blocked asset doesn't
  // prevent the rest of the cache from populating.
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      Promise.all(ASSETS.map(url =>
        cache.add(url).catch(err => console.warn('SW skipped asset:', url, err))
      ))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
        return res;
      })
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
