const CACHE = "baggage-jam-v3";
const SHELL = ["/", "/index.html", "/apple-icon.png", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Network-first for the HTML shell so a deploy is picked up on first reload
  const isShell =
    req.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname === "/index.html";
  if (isShell && url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return resp;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  // Cache-first for everything else (icons, manifest, fonts)
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((resp) => {
        if (resp && resp.ok) {
          const sameOrigin = url.origin === self.location.origin;
          const isFont =
            url.host.includes("fonts.googleapis.com") ||
            url.host.includes("fonts.gstatic.com");
          if (sameOrigin || isFont) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
        }
        return resp;
      }).catch(() => hit);
    })
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "skipWaiting") self.skipWaiting();
});
