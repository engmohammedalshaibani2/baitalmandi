# Cache Strategy

## Multi-Layer Caching Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Service Worker Cache                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ static   │ │ pages    │ │ api-     │ │ assets │  │
│  │ (forever)│ │ (SWR)    │ │ supabase │ │ (cache │  │
│  │          │ │          │ │ (5 min)  │ │ first) │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
├─────────────────────────────────────────────────────┤
│               IndexedDB (PWA Layer)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │ syncQueue│ │offlineCart│ │ offlineOrders        │  │
│  │ (pending)│ │ (24h TTL)│ │ (90d TTL)            │  │
│  └──────────┘ └──────────┘ └──────────────────────┘  │
├─────────────────────────────────────────────────────┤
│               Realtime Invalidation                   │
│  ┌──────────────────────────────────────────────────┐│
│  │ Supabase Realtime → SW message → Cache delete   ││
│  └──────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│               Browser Cache (Zustand)                 │
│  ┌──────────────────────────────────────────────────┐│
│  │ cartStore (memory) — NOT persisted               ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Invalidation Strategy

| Table | Cache to Invalidate | Mechanism |
|-------|-------------------|-----------|
| `orders` | API cache + Report cache | Realtime + SW message |
| `items`, `categories`, `item_prices` | API cache + Page cache | Realtime + SW message |
| `offers`, `offer_items` | API cache + Page cache | Realtime + SW message |
| `site_settings` | API cache | Realtime + SW message |
| `gallery_images` | API cache + Page cache | Realtime + SW message |
| `delivery_zones` | API cache + Page cache | Realtime + SW message |

## SW Cache Invalidation Patterns

```js
// In validation.ts — creates Realtime listener
// Sends INVALIDATE_CACHE message to SW with table name
// SW matches table to URL patterns and deletes matching cache entries
```

## Recommendations

1. **Add Zustand persist middleware** — Persist cart to localStorage (quick win)
2. **Reduce API cache TTL** — 5 min might be too long for order status; use 1 min for orders
3. **Add Cache-Control headers** to API responses for better browser caching
4. **Consider SWR pattern** for report API routes (stale-while-revalidate)
5. **Add memory cache** for frequently accessed settings (already partially done with `settingsCache.ts`)
