const CACHE_NAME = 'when-v1.8.0';
const STATIC_CACHE = 'when-static-v1.8.0';
const DYNAMIC_CACHE = 'when-dynamic-v1.8.0';

// Deliberately UNVERSIONED, and must stay that way: `activate` deletes every cache not
// named here, and scripts/inject-version.js rewrites the versioned names above on each
// release. Versioning this one would throw away every cached card image on every deploy —
// which, with auto-release-on-merge, could be several times a week.
const IMAGE_CACHE = 'when-images';

// Card art is the dominant bandwidth cost, so it gets its own bounded cache. Entries are
// trimmed in insertion order; a re-fetch is only ~30KB, so exact LRU isn't worth the
// IndexedDB bookkeeping it would need.
const MAX_IMAGE_ENTRIES = 400;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/logo192.png',
  '/logo512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE
          )
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle SPA navigation requests - serve index.html for client-side routes
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Network-first for version.json (for update detection)
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Network-first for event JSON data (so we get updates when online)
  if (url.pathname.includes('/events/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Network-first for API calls
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Cache-first for card art, into its own bounded, release-surviving cache
  if (url.hostname === 'res.cloudinary.com') {
    event.respondWith(imageCacheFirst(request));
    return;
  }

  // Cache-first for static assets
  event.respondWith(cacheFirst(request));
});

// Trim the image cache back to MAX_IMAGE_ENTRIES, oldest first (cache.keys() yields
// insertion order). Serialized behind a single in-flight promise so a burst of image
// fetches doesn't run the (relatively expensive) keys() walk once per request.
let trimInFlight = null;
function trimImageCache() {
  if (trimInFlight) return trimInFlight;
  trimInFlight = (async () => {
    const cache = await caches.open(IMAGE_CACHE);
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - MAX_IMAGE_ENTRIES; i++) {
      await cache.delete(keys[i]);
    }
  })()
    .catch(() => {})
    .finally(() => {
      trimInFlight = null;
    });
  return trimInFlight;
}

// Cache-first for Cloudinary card art.
//
// The request is re-issued in CORS mode rather than passed through: images are requested
// by <img>/new Image() as no-cors, which yields an opaque response that (a) reports
// ok === false so the old cacheFirst never actually stored it, and (b) is padded to
// several MB each in storage-quota accounting, which would blow the origin quota and get
// the whole cache evicted. Cloudinary sends Access-Control-Allow-Origin: *, so a CORS
// request gives a real status and true-size accounting instead.
async function imageCacheFirst(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(new Request(request.url, { mode: 'cors', credentials: 'omit' }));
  if (response.ok) {
    await cache.put(request, response.clone());
    trimImageCache();
  }
  return response;
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Only documents may fall back to the app shell. Returning /index.html for a failed
    // image or script meant an HTML body was handed to an <img>, which fails to decode,
    // fires onError and permanently swaps in the category-icon fallback for that card.
    // (Navigations are already handled earlier; this is belt-and-braces.)
    if (request.destination === 'document') {
      const fallback = await caches.match('/index.html');
      if (fallback) {
        return fallback;
      }
    }
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}
