const CACHE_NAME = "agentmash-v30";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./state.js",
  "./packet.js",
  "./render.js",
  "./gestures.js",
  "./manifest.webmanifest",
  "./assets/app-icon.svg",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-512.png",
  "./assets/icons/app-icon-1024.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/startup/apple-iphone-6-9-human-review.png",
  "./assets/startup/apple-iphone-6-5-human-review.png",
  "./assets/screenshots/mobile-review.png",
  "./assets/screenshots/desktop-review.png",
  "./privacy.html",
  "./support.html",
  "./terms.html",
  "./404.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
