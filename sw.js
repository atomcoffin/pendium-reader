// Bump this version string every time you push an update.
const CACHE_VERSION = 'tomen-v1.1.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './fonts/Thow0.3-Regular.woff2',
  './fonts/Thow0.3-Italic.woff2',
  './fonts/Thow0.3-Medium.woff2',
  './fonts/Thow0.3-SemiBold.woff2',
  './fonts/ThowMono0.3-Regular.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS)));
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
