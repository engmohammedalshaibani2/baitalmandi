# PWA Audit

## Current State

### Service Worker (`public/sw.js`, 602 lines)
| Feature | Status |
|---------|--------|
| Cache versioning | ✅ v1, 5 named caches |
| Precaching | ✅ 4 URLs on install |
| Cache strategies | ✅ CacheFirst (static), NetworkFirst (API), StaleWhileRevalidate (pages) |
| Background Sync | ✅ Full implementation with IndexedDB queue |
| Push notifications | ✅ Handler, notification click handler |
| Idempotency injection | ✅ Injects idempotency_key into order requests |
| Mutations queue | ✅ Queues failed mutations for retry |
| Queue lock | ✅ IndexedDB-based distributed lock |
| Cache invalidation | ✅ Message-driven invalidation per table |
| URL classification | ✅ Static/Navigation/API/Realtime/Auth classification |

### PWA Provider (`src/lib/pwa/PwaProvider.tsx`, 217 lines)
| Feature | Status |
|---------|--------|
| SW registration | ✅ With update detection |
| Online/Offline detection | ✅ `navigator.onLine` + event listeners |
| Install prompt | ✅ `beforeinstallprompt` handler |
| Update flow | ✅ SKIP_WAITING + reload |
| Realtime invalidation | ✅ Single channel listener |
| IndexedDB cleanup | ✅ Periodic (completed 7d, failed 30d, carts 24h, orders 90d) |
| Sync queue monitoring | ✅ Queue length tracking |

### Manifest (`public/manifest.json`)
| Field | Value |
|-------|-------|
| `name` | `بيت المندي` |
| `short_name` | `بيت المندي` |
| `start_url` | `/` |
| `display` | `standalone` |
| `background_color` | `#1a1a2e` |
| `theme_color` | `#c8a951` |
| Icons | 192x192 + 512x512 (logo.png) |

## Issues & Fixes

| Issue | Severity | Fix |
|-------|----------|-----|
| `isConnected` polling every 1s | MEDIUM | Reduced to 5s in OrderRealtimeProvider refactor |
| No periodic sync | LOW | Not critical — sync triggered on 'sync' event and 'online' event |
| No FormData handling in SW | LOW | Not needed — all mutations use JSON |
| Missing `background_color` contrast | LOW | Acceptable for dark theme |
| SW not chunked (single 602-line file) | LOW | Works correctly, maintainable |

## Recommendations

1. Add `offline.html` fallback for navigation requests when no cache
2. Add service worker update prompt UI (already in PwaProvider, just needs UI component)
3. Consider Workbox for SW management in future refactor
