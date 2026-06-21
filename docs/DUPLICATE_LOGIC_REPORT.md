# Duplicate Logic Audit Report

## 1. Pricing & Calculations Duplication
**Location:** `src/store/cartStore.ts` vs `src/lib/pricing-engine.ts`
- **Issue:** The `getCartTotal` function in Zustand calculates subtotal/totals on the client-side. The `calculateSubtotal` and `calculateOrderTotals` calculate similar values on the server.
- **Severity:** Low (Expected Pattern).
- **Conclusion:** This is **not** a violation of DRY. It's a required Zero-Trust architecture where the client predicts the total for the UI, and the server calculates the ground-truth total for Database ingestion. Do not merge.

## 2. API Route vs Reporting Services Duplication
**Location:** `src/app/api/reports/.../route.ts` vs `src/services/reports/*.ts`
- **Issue:** The API routes and the Services modules appear to duplicate fetching logic for Admin Reports. AST Analysis flagged the entirety of `src/services/reports` as unused.
- **Severity:** High.
- **Conclusion:** It appears the architecture shifted from using internal service classes to handling logic directly inside API route handlers. The `services/reports` folder is likely entirely redundant and should be reviewed for safe deletion.

## 3. Order Repositories
**Location:** `src/repositories/orderRepository.ts` vs `src/repositories/orderServerRepository.ts`
- **Issue:** `orderServerRepository.ts` is flagged as unused. Functions likely moved to `orderRepository.ts` or directly into `actions/orders.ts`.
- **Severity:** Medium.
- **Conclusion:** Redundant repository layer can be removed after checking dynamic usage.

## 4. Location & Zones Duplication
**Location:** `src/lib/geo/resolve-zone.ts` vs `src/lib/delivery-zones.ts`
- **Issue:** `delivery-zones.ts` is unused. Logic for determining the pricing zone based on coordinates has been centralized in `resolve-zone.ts`.
- **Severity:** Low.
- **Conclusion:** `delivery-zones.ts` is a duplicate leftover and should be safely deleted.

## 5. Boilerplate Supabase Initialization
**Location:** Across 25+ files in `actions` and `api`.
- **Issue:** `const supabase = await createClient();` is called in almost every action and route.
- **Severity:** None.
- **Conclusion:** Normal Next.js App Router pattern for Supabase SSR. No action needed.
