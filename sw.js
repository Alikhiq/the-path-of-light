/* The Path of Light — service worker (offline app shell) */
const CACHE = "pol-v2";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "config.js",
  "content.js",
  "game.js",
  "world.js",
  "manifest.webmanifest",
  "assets/icon.svg",
  "assets/city-of-light.jpg",
  "assets/ustadha-maryam.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
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
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("index.html")))
  );
});
