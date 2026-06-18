# Architecture Review

## Current Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 14 App Router              │
├──────────────┬──────────────────┬────────────────────┤
│  Server      │  Client          │  PWA Layer         │
│  Actions     │  Components      │                    │
├──────────────┼──────────────────┼────────────────────┤
│  createOrder │  Zustand (cart)  │  Service Worker    │
│  getOrders   │  Realtime subs   │  IndexedDB         │
│  admin CRUD  │  Leaflet maps    │  Background Sync   │
└──────┬───────┴──────┬───────────┴────────┬───────────┘
       │              │                    │
       ▼              ▼                    ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL)                    │
│  Auth  │  REST  │  Realtime  │  Storage              │
└─────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Drizzle ORM (Reports only)                          │
│  → 5 Materialized Views                              │
│  → 6 Service modules                                  │
│  → 14 API routes                                      │
└─────────────────────────────────────────────────────┘
```

## Design Patterns

### Repository Pattern
- 9 repositories in `src/repositories/`
- Each encapsulates Supabase queries for a domain entity
- Used by both server actions and API routes

### Server Actions
- 5 action files in `src/actions/`
- `createOrder` — most complex (now transactional + idempotent)
- Admin CRUD actions

### Service Layer (Drizzle)
- 6 service modules in `src/services/reports/`
- Pure Drizzle queries (no Supabase REST)
- Used exclusively by report API routes

## Strengths
- ✅ Clean separation of concerns (Actions ↔ Repositories ↔ Services)
- ✅ Consistent import patterns via `@/` path aliases
- ✅ Server-side validation for all financial data
- ✅ Version-based optimistic locking for orders
- ✅ Dual-layer caching (SW cache + IndexedDB + Realtime invalidation)

## Issues
- ❌ Dual cart systems (Zustand + IndexedDB) without sync
- ❌ Repositories and Actions often duplicate Supabase query logic
- ❌ Report services mix Drizzle ORM with raw SQL in some places
- ❌ No clear error boundary strategy
- ⚠️ `any` types weaken the repository contracts

## Recommendations

1. Consolidate data access into a single DAL layer (choose Supabase REST or Drizzle ORM, not both)
2. Add Zustand `persist` middleware for cart persistence (quick win)
3. Add typed repository interfaces to eliminate `any`
4. Add error boundary components for each route segment
5. Consider migrating order operations to Drizzle ORM for type safety + transactions
