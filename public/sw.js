/* ============================================================
   بيت المندي PWA — Service Worker (PRODUCTION HARDENED v2)
   Cache Versioning | Background Sync | Push | Invalidation
   ============================================================ */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;
const API_CACHE = `api-supabase-${CACHE_VERSION}`;
const REPORT_CACHE = `api-reports-${CACHE_VERSION}`;
const ASSET_CACHE = `assets-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/logo.png',
  '/manifest.json',
];

const SUPABASE_PROJECT = 'lllixewwpdysrootdydd';
const SUPABASE_REST = `https://${SUPABASE_PROJECT}.supabase.co/rest/v1`;
const SUPABASE_REALTIME = `wss://${SUPABASE_PROJECT}.supabase.co/realtime/v1`;
const SUPABASE_AUTH = `https://${SUPABASE_PROJECT}.supabase.co/auth/v1`;

const STALE_PROCESSING_TIMEOUT_MS = 30000;
const QUEUE_LOCK_TTL_MS = 30000;

/* ── Reentrancy guard for sync processing ── */
var _syncing = false;

/* ── IndexedDB helpers ── */
var DB_NAME = 'baitalmandi-pwa';
var DB_VERSION = 2;
var SYNC_STORE = 'syncQueue';
var LOCK_STORE = 'queueLocks';

function openDB() {
  return new Promise(function (resolve, reject) {
    var request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function () {
      var db = request.result;
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        var os = db.createObjectStore(SYNC_STORE, { keyPath: 'id' });
        os.createIndex('status_idx', 'status', { unique: false });
        os.createIndex('idempotency_idx', 'idempotencyKey', { unique: false });
      }
      if (!db.objectStoreNames.contains('tenantMeta')) {
        db.createObjectStore('tenantMeta', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(LOCK_STORE)) {
        db.createObjectStore(LOCK_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = function () { resolve(request.result); };
    request.onerror = function () { reject(request.error); };
  });
}

function dbGetPendingSyncs() {
  return new Promise(function (resolve, reject) {
    openDB().then(function (db) {
      var tx = db.transaction(SYNC_STORE, 'readonly');
      var store = tx.objectStore(SYNC_STORE);
      var index = store.index('status_idx');
      /* Get BOTH pending + stale processing items */
      var pendingReq = index.getAll('pending');
      var processingReq = index.getAll('processing');
      var done = 0;
      var allItems = [];
      pendingReq.onsuccess = function () {
        allItems = allItems.concat(pendingReq.result || []);
        done++;
        if (done === 2) { resolve(allItems); db.close(); }
      };
      pendingReq.onerror = function () { reject(pendingReq.error); db.close(); };
      processingReq.onsuccess = function () {
        var now = Date.now();
        var items = processingReq.result || [];
        /* Recover stale processing items (older than timeout) */
        var stale = items.filter(function (i) { return i.processingStartedAt && (now - i.processingStartedAt) > STALE_PROCESSING_TIMEOUT_MS; });
        allItems = allItems.concat(stale);
        done++;
        if (done === 2) { resolve(allItems); db.close(); }
      };
      processingReq.onerror = function () { reject(processingReq.error); db.close(); };
    }).catch(reject);
  });
}

function dbUpdateSyncStatus(id, status, error) {
  return new Promise(function (resolve, reject) {
    openDB().then(function (db) {
      var tx = db.transaction(SYNC_STORE, 'readwrite');
      var store = tx.objectStore(SYNC_STORE);
      var getReq = store.get(id);
      getReq.onsuccess = function () {
        var item = getReq.result;
        if (item) {
          item.status = status;
          if (status === 'processing') {
            item.retryCount = (item.retryCount || 0) + 1;
            item.processingStartedAt = Date.now();
          }
          if (error) item.error = error;
          store.put(item);
        }
        resolve();
        db.close();
      };
      getReq.onerror = function () { reject(getReq.error); db.close(); };
    }).catch(reject);
  });
}

function dbDeleteSync(id) {
  return new Promise(function (resolve, reject) {
    openDB().then(function (db) {
      var tx = db.transaction(SYNC_STORE, 'readwrite');
      var store = tx.objectStore(SYNC_STORE);
      store.delete(id);
      tx.oncomplete = function () { resolve(); db.close(); };
      tx.onerror = function () { reject(tx.error); db.close(); };
    }).catch(reject);
  });
}

/* ── Acquire/release locks in IndexedDB ── */
function dbAcquireLock(ownerId) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(LOCK_STORE, 'readwrite');
      var store = tx.objectStore(LOCK_STORE);
      var getReq = store.get('main');
      getReq.onsuccess = function () {
        var existing = getReq.result;
        var now = Date.now();
        if (existing && existing.ownerId !== ownerId) {
          if ((now - existing.acquiredAt) < existing.ttl && (now - existing.heartbeatAt) < existing.ttl) {
            resolve(false);
            db.close();
            return;
          }
        }
        store.put({ id: 'main', ownerId: ownerId, acquiredAt: now, ttl: QUEUE_LOCK_TTL_MS, heartbeatAt: now });
        resolve(true);
        db.close();
      };
      getReq.onerror = function () { reject(getReq.error); db.close(); };
    });
  });
}

function dbReleaseLock(ownerId) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(LOCK_STORE, 'readwrite');
      var store = tx.objectStore(LOCK_STORE);
      var getReq = store.get('main');
      getReq.onsuccess = function () {
        var lock = getReq.result;
        if (lock && lock.ownerId === ownerId) {
          store.delete('main');
        }
        resolve();
        db.close();
      };
      getReq.onerror = function () { reject(getReq.error); db.close(); };
    });
  });
}

function dbHeartbeatLock(ownerId) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(LOCK_STORE, 'readwrite');
      var store = tx.objectStore(LOCK_STORE);
      var getReq = store.get('main');
      getReq.onsuccess = function () {
        var lock = getReq.result;
        if (lock && lock.ownerId === ownerId) {
          lock.heartbeatAt = Date.now();
          store.put(lock);
        }
        resolve();
        db.close();
      };
      getReq.onerror = function () { reject(getReq.error); db.close(); };
    });
  });
}

var SW_SESSION_ID = 'sw-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);

/* ── Helpers: body injection for idempotency ── */
function needsIdempotencyInBody(url) {
  return url.indexOf('orders') !== -1 || url.indexOf('/rest/v1/orders') !== -1;
}

function injectIdempotencyKey(body, idempotencyKey) {
  if (!body) return body;
  var parsed = typeof body === 'string' ? JSON.parse(body) : body;
  if (parsed.idempotency_key) return body;
  parsed.idempotency_key = idempotencyKey;
  return JSON.stringify(parsed);
}

function isIdempotencyDuplicate(status, bodyText) {
  if (status !== 409) return false;
  try {
    var body = JSON.parse(bodyText);
    return (body && body.code === '23505') ||
           (body && body.message && body.message.indexOf('duplicate key') !== -1) ||
           (body && body.message && body.message.indexOf('unique constraint') !== -1);
  } catch (e) { return false; }
}

function getBackoffDelay(retryCount) {
  var base = 1000;
  var maxDelay = 30000;
  var delay = Math.min(base * Math.pow(2, (retryCount || 0) - 1), maxDelay);
  return delay + Math.random() * 1000;
}

function delay(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

/* ── Best-effort precache (individual URL failures don't block install) ── */
function precacheUrls(cache) {
  return Promise.allSettled(PRECACHE_URLS.map(function (url) {
    return cache.add(url).catch(function () {});
  }));
}

/* ── Install ── */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return precacheUrls(cache);
    }).then(function () {
      return self.skipWaiting();
    }),
  );
});

/* ── Activate ── */
self.addEventListener('activate', function (event) {
  var validCaches = [STATIC_CACHE, PAGE_CACHE, API_CACHE, REPORT_CACHE, ASSET_CACHE];
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return !validCaches.includes(k); })
          .map(function (k) { return caches.delete(k); }),
      );
    }).then(function () {
      return self.clients.claim();
    }),
  );
});

/* ── URL classification helpers ── */
function isMutation(method) { return method !== 'GET' && method !== 'HEAD'; }
function isSupabaseRealtime(url) { return url.href.startsWith(SUPABASE_REALTIME); }
function isSupabaseRest(url) { return url.href.startsWith(SUPABASE_REST); }
function isSupabaseAuth(url) { return url.href.startsWith(SUPABASE_AUTH); }
function isApiRoute(url) { return /^\/api\//.test(url.pathname); }
function isStaticAsset(url) { return /\.(js|css|woff2?|ttf|eot|svg|ico|png|jpg|jpeg|gif|webp|avif)$/i.test(url.pathname); }
function isNavigation(url) { return url.pathname === '/' || /^\/[a-z-]*(\/)?$/.test(url.pathname); }

/* ── CacheFirst ── */
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response.ok) cache.put(request, response.clone());
        return response;
      });
    });
  });
}

/* ── NetworkFirst ── */
function networkFirst(request, cacheName, maxAgeMs) {
  return fetch(request).then(function (response) {
    if (response.ok) {
      caches.open(cacheName).then(function (cache) { cache.put(request, response.clone()); });
    }
    return response;
  }).catch(function () {
    return caches.open(cacheName).then(function (cache) {
      return cache.match(request).then(function (cached) {
        if (cached) {
          if (maxAgeMs) {
            var dateHeader = cached.headers.get('date');
            if (dateHeader) {
              var age = Date.now() - new Date(dateHeader).getTime();
              if (age > maxAgeMs) return null;
            }
          }
          return cached;
        }
        if (request.mode === 'navigate') return caches.match('/offline');
        if (isSupabaseRest(new URL(request.url))) {
          return new Response(JSON.stringify({ data: null, error: { message: 'offline' } }), {
            status: 503, headers: { 'Content-Type': 'application/json' },
          });
        }
        return null;
      });
    });
  });
}

/* ── StaleWhileRevalidate ── */
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var fetchPromise = fetch(request).then(function (response) {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(function () { return cached; });
      return cached || fetchPromise;
    });
  });
}

/* ── Process sync queue ── */
function processSyncQueue() {
  if (_syncing) return Promise.resolve();
  _syncing = true;

  return dbAcquireLock(SW_SESSION_ID).then(function (acquired) {
    if (!acquired) {
      _syncing = false;
      return;
    }

    /* Heartbeat */
    var heartbeatHandle = setInterval(function () {
      dbHeartbeatLock(SW_SESSION_ID);
    }, 10000);

    return dbGetPendingSyncs().then(function (items) {
      if (!items || !items.length) {
        clearInterval(heartbeatHandle);
        return dbReleaseLock(SW_SESSION_ID).then(function () { _syncing = false; });
      }

      var promise = Promise.resolve();
      items.forEach(function (item) {
        promise = promise.then(function () {
          if (item.retryCount >= (item.maxRetries || 3)) {
            return dbUpdateSyncStatus(item.id, 'failed', 'Max retries exceeded');
          }

          return dbUpdateSyncStatus(item.id, 'processing').then(function () {
            var opts = {
              method: item.method || 'POST',
              headers: Object.assign(
                { 'Content-Type': 'application/json' },
                item.headers || {},
              ),
            };

            var bodyStr = item.body ? (typeof item.body === 'string' ? item.body : JSON.stringify(item.body)) : null;

            /* Inject idempotency_key into body for order mutations */
            if (bodyStr && item.idempotencyKey && needsIdempotencyInBody(item.url)) {
              bodyStr = injectIdempotencyKey(bodyStr, item.idempotencyKey);
            }

            if (bodyStr && item.method !== 'GET') {
              opts.body = bodyStr;
            }
            opts.headers['x-idempotency-key'] = item.idempotencyKey;

            return fetch(item.url, opts).then(function (res) {
              if (res.ok) {
                return dbUpdateSyncStatus(item.id, 'completed');
              }
              return res.text().then(function (bodyText) {
                if (isIdempotencyDuplicate(res.status, bodyText)) {
                  return dbUpdateSyncStatus(item.id, 'completed');
                }
                if (res.status >= 400 && res.status < 500) {
                  return dbUpdateSyncStatus(item.id, 'failed', 'HTTP ' + res.status);
                }
                var backoff = getBackoffDelay(item.retryCount);
                return dbUpdateSyncStatus(item.id, 'pending', 'HTTP ' + res.status + ', retry in ' + backoff + 'ms').then(function () {
                  return delay(backoff);
                });
              });
            }).catch(function (err) {
              var backoff = getBackoffDelay(item.retryCount);
              return dbUpdateSyncStatus(item.id, 'pending', err.message + ', retry in ' + backoff + 'ms').then(function () {
                return delay(backoff);
              });
            });
          });
        });
      });

      return promise.then(function () {
        clearInterval(heartbeatHandle);
        return dbReleaseLock(SW_SESSION_ID).then(function () { _syncing = false; });
      });
    }).catch(function () {
      clearInterval(heartbeatHandle);
      dbReleaseLock(SW_SESSION_ID).then(function () { _syncing = false; });
    });
  }).catch(function () {
    _syncing = false;
  });
}

/* ── Push notification handlers ── */
function handlePushEvent(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {
    data = { title: event.data ? event.data.text() : 'بيت المندي' };
  }
  var title = data.title || 'بيت المندي';
  var options = {
    body: data.body || 'لديك تحديث جديد',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'order-update',
    data: data.data || {},
    actions: [{ action: 'open', title: 'فتح التطبيق' }],
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
}

function handleNotificationClick(event) {
  event.notification.close();
  var urlToOpen = '/';
  if (event.notification.data && event.notification.data.url) urlToOpen = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    }),
  );
}

/* ── Strip sensitive headers before persisting ── */
function stripSensitiveHeaders(headers) {
  var safe = {};
  var sensitive = ['cookie', 'authorization', 'x-auth-token', 'next-action', 'next-router-state-tree', 'next-url', 'next-router-prefetch'];
  for (var key in headers) {
    if (headers.hasOwnProperty(key)) {
      var lower = key.toLowerCase();
      if (sensitive.indexOf(lower) !== -1) continue;
      if (lower.startsWith('sb-')) continue;
      if (lower.startsWith('x-next-')) continue;
      safe[key] = headers[key];
    }
  }
  return safe;
}

/* ── Fetch event ── */
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  if (isSupabaseRealtime(url)) return;
  if (isMutation(event.request.method)) {
    /* Use fetch failure detection instead of navigator.onLine */
    event.respondWith(
      fetch(event.request.clone()).catch(function () {
        /* Network failed — queue for background sync */
        return event.request.clone().text().then(function (body) {
          return new Promise(function (resolve) {
            openDB().then(function (db) {
              var tx = db.transaction(SYNC_STORE, 'readwrite');
              var store = tx.objectStore(SYNC_STORE);
              var idemKey = event.request.headers.get('x-idempotency-key') || ('idem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10));
              var bodyWithIdem = body;
              if (needsIdempotencyInBody(event.request.url)) {
                bodyWithIdem = injectIdempotencyKey(body, idemKey);
              }
              var reqHeaders = {};
              try {
                event.request.headers.forEach(function (v, k) { reqHeaders[k] = v; });
              } catch (e) { reqHeaders = {}; }
              store.add({
                id: 'sync-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10),
                tenantId: event.request.headers.get('x-tenant-id') || 'default',
                type: 'mutation',
                url: event.request.url,
                method: event.request.method,
                headers: stripSensitiveHeaders(reqHeaders),
                body: bodyWithIdem,
                idempotencyKey: idemKey,
                timestamp: Date.now(),
                retryCount: 0,
                maxRetries: 3,
                status: 'pending',
                processingStartedAt: null,
              });
              tx.oncomplete = function () {
                db.close();
                if (self.registration.sync) {
                  self.registration.sync.register('pwa-sync-queue').catch(function () {});
                }
                resolve(new Response(JSON.stringify({ queued: true }), {
                  status: 202, headers: { 'Content-Type': 'application/json' },
                }));
              };
            });
          });
        });
      })
    );
    return;
  }

  if (isSupabaseAuth(url)) return;
  if (isSupabaseRest(url)) { event.respondWith(networkFirst(event.request, API_CACHE, 5 * 60 * 1000)); return; }
  if (isApiRoute(url)) { event.respondWith(networkFirst(event.request, REPORT_CACHE)); return; }
  if (isStaticAsset(url)) { event.respondWith(cacheFirst(event.request, ASSET_CACHE)); return; }
  if (event.request.mode === 'navigate' || isNavigation(url)) { event.respondWith(staleWhileRevalidate(event.request, PAGE_CACHE)); return; }
  event.respondWith(staleWhileRevalidate(event.request, PAGE_CACHE));
});

/* ── URL patterns per table for targeted cache invalidation ── */
var INV_PATTERNS = {
  orders:          [/orders/],
  items:           [/items/, /menu/],
  categories:      [/categories/, /menu/],
  item_prices:     [/item_prices/, /menu/, /items/],
  offers:          [/offers/],
  offer_items:     [/offer_items/, /offers/],
  site_settings:   [/settings/],
  gallery_images:  [/gallery/],
  delivery_zones:  [/delivery/, /zones/],
};

function cacheMatchesTable(cacheUrl, table) {
  var patterns = INV_PATTERNS[table];
  if (!patterns || patterns.length === 0) return true;
  return patterns.some(function (p) { return p.test(cacheUrl); });
}

/* ── Message handler ── */
self.addEventListener('message', function (event) {
  var msg = event.data || {};
  if (msg.type === 'INVALIDATE_CACHE') {
    var payload = msg.payload;
    if (!payload || !payload.table) return;
    var cacheNames = [];
    switch (payload.table) {
      case 'orders':            cacheNames = [API_CACHE, REPORT_CACHE]; break;
      case 'items':
      case 'categories':
      case 'item_prices':
      case 'offers':
      case 'offer_items':
      case 'site_settings':
      case 'gallery_images':
      case 'delivery_zones':    cacheNames = [API_CACHE, PAGE_CACHE]; break;
    }
    event.waitUntil(
      Promise.all(cacheNames.map(function (cn) {
        return caches.open(cn).then(function (cache) {
          return cache.keys().then(function (keys) {
            var toDelete = keys.filter(function (req) {
              return cacheMatchesTable(req.url, payload.table);
            });
            return Promise.all(toDelete.map(function (req) { return cache.delete(req); }));
          });
        });
      })).then(function () {
        return self.clients.matchAll().then(function (clients) {
          clients.forEach(function (client) {
            client.postMessage({ type: 'CACHE_INVALIDATED', payload: payload });
          });
        });
      }),
    );
  }
  if (msg.type === 'SKIP_WAITING') { self.skipWaiting(); }
  if (msg.type === 'PROCESS_SYNC_QUEUE') { event.waitUntil(processSyncQueue()); }
});

/* ── Background Sync event ── */
self.addEventListener('sync', function (event) {
  if (event.tag === 'pwa-sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

/* ── Push events ── */
self.addEventListener('push', handlePushEvent);
self.addEventListener('notificationclick', handleNotificationClick);
