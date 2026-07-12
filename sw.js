/* The Path of Light — service worker (offline app shell) */
const CACHE = "pol-v5";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "config.js",
  "content.js",
  "game.js",
  "world.js",
  "audio.js",
  "manifest.webmanifest",
  "assets/icon.svg",
  "assets/city-of-light.jpg",
  "assets/ustadha-maryam.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const sameOrigin = new URL(req.url).origin === location.origin;
  if (sameOrigin) {
    // network-first: returning players always get the latest build; cache is offline fallback
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(h => h || caches.match("index.html")))
    );
  } else {
    // cache-first for CDN assets (three.js, fonts)
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
  }
});
