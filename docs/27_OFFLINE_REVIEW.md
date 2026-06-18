# Offline Review

## Offline Capabilities

| Feature | Status | Details |
|---------|--------|---------|
| Service Worker | ✅ | Full SW with 5 caches |
| Cache strategies | ✅ | CacheFirst (static), NetworkFirst (API), StaleWhileRevalidate (pages) |
| Background Sync | ✅ | IndexedDB queue + sync event |
| Idempotency for retries | ✅ | `idempotency_key` injected into order mutations |
| Queue lock | ✅ | IndexedDB-based distributed lock |
| Offline fallback | ⚠️ Partial | `/offline` page exists, SW returns it for failed navigations |
| Cart persistence | ❌ | Zustand cart lost on page refresh (not synced with IndexedDB) |
| FormData handling | ❌ | Not needed (all JSON) |
| Periodic sync | ❌ | Only on `sync` event + `online` event |

## Cache Contents

| Cache | Strategy | Max Age | Contents |
|-------|----------|---------|----------|
| `static-*` | CacheFirst | Forever | SW, manifest, precached URLs |
| `pages-*` | StaleWhileRevalidate | Immediate | All navigations (HTML) |
| `api-supabase-*` | NetworkFirst | 5 min | GET requests to Supabase REST |
| `api-reports-*` | NetworkFirst | Immediate | Report API routes |
| `assets-*` | CacheFirst | Forever | JS, CSS, fonts, images |

## Offline Flow

```
User action → Online? → YES → Fetch from network → Cache response → Return
                      → NO  → Check IndexedDB queue → Queue mutation
                            → Return queued response (202)
                            → On reconnect: Process queue in order
                              → Idempotent: each item has unique key
                              → Duplicate detection on server
```

## Recommendations

1. Add Zustand `persist` middleware for cart persistence (highest priority)
2. Add periodic background sync registration (minimal effort)
3. Add Cache-Control headers to API responses for better SW caching
4. Improve offline fallback page with cached data display
