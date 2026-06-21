# Safe Cleanup Plan

## 1. Safe To Delete
These files and elements have been proven via AST Analysis to be 100% unused, with no dynamic path resolutions that depend on them.

**Files:**
- `src/app/admin/login/actions.ts` (Login actions replaced by API or middleware)
- `src/app/page.module.css` (Tailwind is used instead)
- `src/cache/reportsCache.ts` (No calls exist)
- `src/lib/constants.ts` (Dead file)
- `src/lib/currency.ts` (Redundant)
- `src/lib/delivery-zones.ts` (Replaced by resolve-zone.ts)
- `src/repositories/orderServerRepository.ts` (Functions moved)
- `test-db.ts` (One-off script)
- `test-rls.ts` (One-off script)

**Exports/Types:**
- `generateReceiptBody` in `components/invoice/receipt-html.ts`
- `resolveZone` in `lib/geo/resolve-zone.ts`
- `safeNumber` in `lib/pricing-engine.ts`

**Dependencies:**
- `@sentry/nextjs`
- `@upstash/redis`
- `dompurify`
- `file-saver`
- `gsap`
- `jspdf-autotable`
- `marked`
- `posthog-js`
- `puppeteer-core`

## 2. Review Required
These files are flagged as unused by static analysis, but they might be invoked dynamically via Server Actions, Reflection, or API Routes. We will NOT delete them in Phase 6 without explicit permission.

**Files:**
- `run-migration.ts` (Likely used via CLI `npm run db:migrate`)
- `scripts/generate-pdfs.js` (Likely used via CLI scripts)
- `src/actions/categories.ts` (Server Action - may be used by admin UI)
- `src/actions/items.ts` (Server Action - may be used by admin UI)
- `src/services/reports/analyticsEngine.ts`
- `src/services/reports/customerReport.ts`
- `src/services/reports/dashboardReport.ts`
- `src/services/reports/ordersReport.ts`
- `src/services/reports/productReport.ts`

**Exports:**
- `updateOrderStatus` in `actions/orders.ts`
- `getOrders` in `actions/orders.ts`
- `getOrderById` in `actions/orders.ts`

## 3. Must Keep
These elements were flagged by some tools or appear unused, but are crucial for Next.js and Runtime operations.

- `sharp` (Dependency) - Crucial for Next.js `next/image` optimization in production.
- `xlsx` (Dependency) - Verify usage in `lib/exportExcel.ts`.
- `createOrder` (Core Business Logic)
- `updateOrderStatus` (Core Business Logic - if used dynamically)
- `pricing-engine` (Core Business Logic)
- `delivery-pricing` (Core Business Logic)
- `logger` (Core Business Logic)
- Supabase repositories & Drizzle transactions.
