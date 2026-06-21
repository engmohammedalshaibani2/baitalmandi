const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-cache-${CACHE_VERSION}`;

const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  OFFLINE_URL,
  '/logo.jpg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

const NEVER_CACHE_URLS = [
  '/admin',
  '/api',
  '/track-order',
  '/t/',
  'supabase.co',
  '/checkout'
];

const OFFLINE_FALLBACK_ROUTES = [
  '/',
  '/menu',
  '/gallery',
  '/contact'
];

// Helper to check if URL should never be cached
function shouldNeverCache(url) {
  return NEVER_CACHE_URLS.some(path => url.includes(path));
}

// Helper to check if URL is a public route that gets offline fallback
function isPublicRouteForOfflineFallback(urlStr) {
  try {
    const url = new URL(urlStr);
    const path = url.pathname;
    return path === '/' || OFFLINE_FALLBACK_ROUTES.includes(path);
  } catch (e) {
    return false;
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const urlStr = request.url;

  // 1. Skip non-GET requests or never-cache URLs
  if (request.method !== 'GET' || shouldNeverCache(urlStr)) {
    return;
  }

  // 2. Handle HTML Navigation requests (Network First, fallback to offline ONLY for public routes)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Offline Fallback
          if (isPublicRouteForOfflineFallback(urlStr)) {
            return caches.match(OFFLINE_URL);
          }
          // Do nothing for other routes (browser handles natural offline error)
        })
    );
    return;
  }

  // 3. Handle Images, Fonts, CSS, JS (Cache First, then Network)
  const isStaticAsset = 
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Ignore failures for static assets silently
        });
      })
    );
    return;
  }
});

// ==========================================
// PUSH NOTIFICATIONS ARCHITECTURE SKELETON
// ==========================================
// Note: Architecture skeleton only. No active sending or API logic is implemented.
self.addEventListener('push', function(event) {
  /*
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'إشعار من بيت المندي';
  const options = {
    body: data.body || 'لديك تحديث جديد بخصوص طلبك.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.url || '/'
  };
  event.waitUntil(self.registration.showNotification(title, options));
  */
});

self.addEventListener('notificationclick', function(event) {
  /*
  event.notification.close();
  const targetUrl = event.notification.data || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
  */
});
