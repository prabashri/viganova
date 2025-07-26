const CACHE_NAME = 'nviews-cache-v1';
const PRECACHE_URLS = [
  // Example entries; overwrite this array with siteDefaults.serviceWorker entries
  '/fonts/Inter-Regular-Subset.woff2',
  '/fonts/Inter-Bold-Subset.woff2',
  '/search-index.5un4j3.json',
  '/scripts/search.t9nimk.min.js',
  

];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Fonts
  if (req.destination === 'font') {
    event.respondWith(fontCache(req));
    return;
  }

  // CSS and JS
  if (req.destination === 'style' || req.destination === 'script') {
    event.respondWith(staticCache(req));
    return;
  }

  // Others: fallback to network-first
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

async function fontCache(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;

  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staticCache(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return cached;
  }
}
