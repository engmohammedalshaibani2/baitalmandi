# PROJECT BASELINE

**Project:** baitalmandiwibapp (بيت المندي)
**Version:** 0.1.0 (private)
**Audit Date:** 18 June 2026
**Repository:** `git+https://github.com/engmohammedalshaibani2/baitalmandi.git`
**License:** ISC

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.3 |
| UI Library | React | ^18.3.1 |
| Language | TypeScript | ^5.4.5 |
| Database | PostgreSQL (Supabase) | — |
| ORM | Drizzle ORM | ^0.30.10 |
| Auth | Supabase SSR | ^0.3.0 |
| State | Zustand | ^4.5.2 |
| Styling | Tailwind CSS | ^3.4.3 |
| Maps | Leaflet + Turf.js | ^1.9.4 + ^7.3.5 |
| Charts | Recharts | ^3.8.1 |
| PDF | jsPDF + html2canvas | ^4.2.1 + ^1.4.1 |
| XLSX | ExcelJS + xlsx | ^4.4.0 + ^0.18.5 |
| Animation | Framer Motion | ^11.2.6 |
| Validation | Zod | ^4.4.3 |

---

## File Inventory

| Directory | Files | Description |
|-----------|-------|-------------|
| `src/app/` | 36 | Pages, layouts, API routes |
| `src/actions/` | 5 | Server Actions |
| `src/repositories/` | 9 | Data access layer |
| `src/services/reports/` | 6 | Drizzle analytics engine |
| `src/lib/` | 17+6 | Utilities, PWA, Geo, Push, Cache, Sync |
| `src/components/` | 15 | React components |
| `src/store/` | 1 | Zustand cart store |
| `src/db/` | 2 | Drizzle schema + client |
| `src/schemas/` | 1 | Zod validation schemas |
| `src/validators/` | 1 | Zod order schemas |
| `src/cache/` | 2 | Client-side in-memory cache |
| `src/realtime/` | 1 | Supabase Realtime provider |
| `src/utils/supabase/` | 3 | Supabase clients |
| `src/__tests__/` | 1 | Vitest test |
| `public/` | 12 | Static assets, SW, manifest |
| `supabase/migrations/` | 18 | Database migrations |
| `scripts/` | 3 | Utility scripts |

**Total src files: 117** (77 `.ts` + 40 `.tsx`)
**Total project files (excl node_modules/.next): ~172**

---

## Route Inventory (35 total)

### Static Pages (17)
`/`, `/admin`, `/admin/categories`, `/admin/delivery`, `/admin/gallery`, `/admin/login`, `/admin/menu`, `/admin/offers`, `/admin/orders`, `/admin/reports`, `/admin/reviews`, `/admin/settings`, `/cart`, `/contact`, `/gallery`, `/menu`, `/my-orders`, `/offline`, `/test-map`

### Dynamic Pages (2 patterns)
`/t/[token]`, `/track-order/[orderId]`

### API Routes (14)
`/api/auth/login`, `/api/reports/audit`, `/api/reports/compare`, `/api/reports/cron`, `/api/reports/customers`, `/api/reports/dashboard`, `/api/reports/delivery-analytics`, `/api/reports/invoices`, `/api/reports/offers`, `/api/reports/orders`, `/api/reports/products`, `/api/reports/refresh-mv`, `/api/reports/sales`, `/api/reports/schedule`, `/api/resolve-zone`

---

## Database Inventory

| Tables | 23 | Columns range: 3-37 |
|--------|-----|---------------------|
| Enums | 7 | admin_role, offer_status, order_method, order_status, payment_method, audit_action, report_period |
| Indexes | 41 | 14 unique, 7 duplicate pairs |
| Foreign Keys | 15 | No circular dependencies |
| Materialized Views | 5 | All support CONCURRENTLY refresh |
| Migrations | 18 | 0000-0017 (only 0000-0001 tracked in journal) |

---

## Current Technical Debt

| Category | Issue | Severity |
|----------|-------|----------|
| **CRITICAL** | `order_sequences` RLS lockout — 0 policies with RLS enabled | CRITICAL |
| **Code Quality** | 137 console.log in production (18 files) | HIGH |
| **Code Quality** | 184 `: any` annotations (54 files) | HIGH |
| **Code Quality** | 8 dead source files, multiple unused exports | MEDIUM |
| **Dependencies** | 8 unused npm packages (~250KB waste) | MEDIUM |
| **Database** | 7 duplicate indexes, 3 overlapping indexes | LOW |
| **Database** | Migration journal missing 16/18 entries | MEDIUM |
| **Security** | No CSP header | HIGH |
| **Security** | 7 tables without RLS | MEDIUM |
| **Architecture** | Dual cart system (Zustand + IndexedDB, no sync) | MEDIUM |
| **Architecture** | No transaction in order creation (10 independent ops) | HIGH |
| **Realtime** | Per-order channels hit Supabase connection limit | HIGH |
| **Financial** | Idempotency precedence bug in orders.ts:468 | HIGH |
| **Financial** | No audit_log on order creation | MEDIUM |
| **PWA** | No periodic sync, no FormData handling | LOW |
| **PWA** | `isConnected` polling unreliable | MEDIUM |

---

## Build Status

| Check | Status |
|-------|--------|
| TypeScript strict | ✅ `strict: true` |
| Build | ✅ Passes (35/35 static pages) |
| Lint | ⚠️ Bootstrapped (needs full run) |
| Bundle size (largest) | 428 kB (`/admin/reports`) |

---

## Environment Variables

| Variable | Required | Used In |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | All Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | All Supabase clients |
| `DATABASE_URL` | ✅ | Drizzle client |
| `DIRECT_URL` | ✅ | Drizzle Kit migrations |
| `CRON_SECRET` | ⬜ Optional | Report cron endpoints |

---

## External Services

| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | DB, Auth, Realtime, Storage | ✅ Active |
| Google Fonts | Cairo, Tajawal, Noto Sans Arabic | ✅ Active |
| Unsplash | Remote images | ✅ Configured |
| OSRM | Route calculation | ⚠️ Unclear endpoint |
| Nominatim/OSM | Reverse geocoding | ✅ Active |
| Leaflet (OSM tiles) | Map rendering | ✅ Active |
| Upstash Redis | `@upstash/redis` package | ❌ Unused code |
| Sentry | `@sentry/nextjs` package | ❌ Unused code |
| PostHog | `posthog-js` package | ❌ Unused code |

---

## Architecture Pattern

**Hybrid Architecture:** Next.js App Router + Repository Pattern + Server Actions + Offline-First PWA + Realtime Subscriptions + Drizzle ORM (reports only)

```
UI Layer → State Layer → Repositories (client) → Supabase REST
UI Layer → Server Actions → Supabase REST/PostgreSQL
UI Layer → Services (server) → Drizzle ORM → PostgreSQL
PWA Layer → IndexedDB → Background Sync → Supabase REST
```
