import type { TableCacheMapping, CacheInvalidationEvent } from '@/lib/pwa/types';

/* ── Maps Supabase tables to cache store names ── */
const TABLE_TO_CACHE: Record<string, string[]> = {
  orders:            ['pages', 'api-reports'],
  items:             ['pages', 'api-supabase'],
  categories:        ['pages', 'api-supabase'],
  item_prices:       ['pages', 'api-supabase'],
  offers:            ['pages', 'api-supabase'],
  offer_items:       ['pages', 'api-supabase'],
  site_settings:     ['pages', 'api-supabase'],
  gallery_images:    ['pages', 'api-supabase'],
  delivery_zones:    ['pages', 'api-supabase'],
  push_subscriptions:[],
  cart_items:        [],
};

/* ── URL patterns per table for targeted cache invalidation ── */
const TABLE_URL_PATTERNS: Record<string, RegExp[]> = {
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

export function getCacheKeysForTable(table: string): string[] {
  return TABLE_TO_CACHE[table] || [];
}

export function getUrlPatternsForTable(table: string): RegExp[] {
  return TABLE_URL_PATTERNS[table] || [];
}

export function registerTableMapping(mapping: TableCacheMapping): void {
  if (!TABLE_TO_CACHE[mapping.table]) {
    TABLE_TO_CACHE[mapping.table] = [];
  }
  for (const key of mapping.cacheKeys) {
    if (!TABLE_TO_CACHE[mapping.table].includes(key)) {
      TABLE_TO_CACHE[mapping.table].push(key);
    }
  }
}

export async function invalidateCache(event: CacheInvalidationEvent): Promise<void> {
  const cacheNames = getCacheKeysForTable(event.table);
  if (cacheNames.length === 0 || !('caches' in self)) return;

  const urlPatterns = getUrlPatternsForTable(event.table);

  const ops = cacheNames.map(async (cacheName) => {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const deleteOps = keys
        .filter((req) => {
          if (urlPatterns.length === 0) return true;
          const reqUrl = req.url;
          return urlPatterns.some((pattern) => pattern.test(reqUrl));
        })
        .map((req) => cache.delete(req));
      await Promise.all(deleteOps);
    } catch {
      /* cache may not exist yet */
    }
  });

  await Promise.all(ops);
}

export async function invalidateCacheViaSW(event: CacheInvalidationEvent): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'INVALIDATE_CACHE',
      payload: event,
    });
  }
}

/* ── Consolidated single-channel listener (instead of 11 separate channels) ── */
let _invalidationCleanup: (() => void) | null = null;

export function createRealtimeInvalidationListener(
  supabase: any,
  onInvalidate?: (event: CacheInvalidationEvent) => void,
): () => void {
  /* Cleanup any previous listener */
  if (_invalidationCleanup) {
    _invalidationCleanup();
    _invalidationCleanup = null;
  }

  const channel = supabase
    .channel('cache-invalidation-wildcard')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload: any) => {
        const table = payload.table as string;
        /* Only process tables we care about */
        if (!TABLE_TO_CACHE[table]) return;
        const event: CacheInvalidationEvent = {
          table,
          eventType: payload.eventType,
          payload: payload.new || payload.old,
        };
        invalidateCacheViaSW(event);
        onInvalidate?.(event);
      },
    )
    .subscribe();

  _invalidationCleanup = () => {
    supabase.removeChannel(channel);
    _invalidationCleanup = null;
  };

  return _invalidationCleanup;
}
