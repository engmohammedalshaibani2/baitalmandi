# Dead Code Detection Report

## Executive Summary
This report analyzes unused code elements, dependencies, and types across the Bait Al Mandi Next.js project. It was generated using AST analysis (Knip) to statically detect unused exports, files, and dependencies.

### 1. Unused Files
The following files are not imported or utilized anywhere in the source code.

| File | Type | Reason for Flagging | Action Plan |
|------|------|---------------------|-------------|
| `run-migration.ts` | Utility Script | Script ran independently; not imported. | Review Required (likely needed for dev/ops) |
| `scripts/generate-pdfs.js` | Utility Script | Standalone JS script. | Review Required |
| `src/actions/categories.ts` | Server Action | Unused in components. | Review Required (check dynamic imports/admin) |
| `src/actions/items.ts` | Server Action | Unused in components. | Review Required |
| `src/app/admin/login/actions.ts` | Server Action | Replaced by API routes or client logic. | Safe To Delete |
| `src/app/page.module.css` | Stylesheet | Replaced by TailwindCSS. | Safe To Delete |
| `src/cache/reportsCache.ts` | Cache | Never invoked. | Safe To Delete |
| `src/lib/constants.ts` | Consts | No exports used. | Safe To Delete |
| `src/lib/currency.ts` | Utility | Overlaps with formatUtils. | Safe To Delete |
| `src/lib/delivery-zones.ts` | Utility | Using `resolve-zone.ts` instead. | Safe To Delete |
| `src/repositories/orderServerRepository.ts` | Repository | Merged into `orderRepository.ts` or unused. | Safe To Delete |
| `src/services/reports/analyticsEngine.ts` | Service | Unused report engine logic. | Review Required |
| `src/services/reports/customerReport.ts` | Service | Unused report logic. | Review Required |
| `src/services/reports/dashboardReport.ts` | Service | Unused report logic. | Review Required |
| `src/services/reports/ordersReport.ts` | Service | Unused report logic. | Review Required |
| `src/services/reports/productReport.ts` | Service | Unused report logic. | Review Required |
| `test-db.ts`, `test-rls.ts` | Test Scripts | One-off test scripts. | Safe To Delete |

### 2. Unused Dependencies
Detected via `package.json` vs codebase analysis.
- `@sentry/nextjs`
- `@upstash/redis`
- `dompurify`
- `file-saver`
- `gsap`
- `jspdf-autotable`
- `marked`
- `posthog-js`
- `puppeteer-core`
- `sharp` (Actually, sharp might be used dynamically by Next.js for image optimization, must keep)
- `xlsx` (Check exportExcel.ts before deleting)

### 3. Unused Exports (Partial List)
*Note: A total of 39 unused exports and 32 unused exported types were detected.*
- `getOrders`, `getOrderById`, `updateOrderStatus` in `src/actions/orders.ts` (Likely used dynamically or are old).
- `generateReceiptBody` in `src/components/invoice/receipt-html.ts`
- `resolveZone` in `src/lib/geo/resolve-zone.ts`
- `safeNumber` in `src/lib/pricing-engine.ts`

### 4. Dynamic Usage Caveats
Before considering files from the **Review Required** section as truly dead, we must consider:
1. `src/services/reports/*`: These might be called dynamically in `src/app/api/reports/.../route.ts` using string-based pathing or might just be orphaned from a previous implementation.
2. `src/actions/orders.ts`: Exports like `updateOrderStatus` might be invoked by a Client Component in the admin dashboard.
3. `sharp`: Next.js image optimization dynamically requires this in production. Do not delete.

---
*Generated via automated code audit tools (Knip + Manual Validation).*
