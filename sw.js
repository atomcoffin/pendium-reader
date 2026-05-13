// =====================================================================
// IMPORTANT — RELEASE PROCESS
// Bump CACHE_VERSION on EVERY meaningful release. The version string is
// the cache key — if it doesn't change, returning users get the old
// cached HTML/CSS/JS until they manually clear cache. The activate
// handler below deletes any cache whose key doesn't match this version.
// Add new assets (fonts, icons) to ASSETS so they're cached on install.
// =====================================================================
const CACHE_VERSION = 'tomen-v1.36.1';

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
  './vendor/jszip.min.js',
  // Phosphor icon CSS — referenced by <link> in index.html. Caching just
  // the CSS gives a partial offline win: the rules apply offline, but the
  // glyph font (which the CSS references with relative URLs into the
  // jsdelivr package) may still need network if uncached. Full Phosphor
  // self-hosting is a future improvement; this one-liner is risk-free.
  'https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css'
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
  // Only handle GET over http(s). POSTs throw on cache.put, and schemes
  // like chrome-extension:// can't be cached at all — passing them through
  // avoids polluting the console and breaking unrelated extensions.
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);
  // Only cache responses that succeeded and weren't redirects/opaque
  // failures — otherwise a 500 page or an opaque-redirect can overwrite
  // a previously-good cached entry.
  const cacheableRes = (res) => res && res.ok && res.type !== 'opaqueredirect';

  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then(res => {
        if (cacheableRes(res)) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(res => {
        if (cacheableRes(res)) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
        }
        return res;
      })
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
