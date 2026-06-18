# TypeScript Strict Audit

## Current State

| Metric | Count |
|--------|-------|
| `: any` annotations | 190 |
| `as any` assertions | 34 |
| **Total any usage** | **224** |
| Files affected | 60 |
| `ts-ignore` comments | 0 |
| `eslint-disable` comments | 0 |
| `strict: true` in tsconfig | ✅ |

## Top 10 Files by any Usage

| Rank | File | any Count |
|------|------|-----------|
| 1 | `lib/printReport.ts` | 29 |
| 2 | `app/admin/offers/page.tsx` | 14 |
| 3 | `lib/exportExcel.ts` | 11 |
| 4 | `app/api/reports/products/route.ts` | 9 |
| 5 | `app/menu/page.tsx` | 8 |
| 6 | `app/admin/menu/page.tsx` | 7 |
| 7 | `app/admin/delivery/page.tsx` | 7 |
| 8 | `lib/geo/sanaa-boundaries.ts` | 6 |
| 9 | `app/api/reports/offers/route.ts` | 6 |
| 10 | `app/my-orders/page.tsx` | 6 |

## Patterns of any Usage

1. **Supabase query results** (~40%): `const { data } = await supabase.from('x').select('*')` — `data` typed as `any`
2. **Event handlers** (~15%): Realtime payloads, DOM events
3. **External library data** (~15%): Leaflet maps, jsPDF, html2canvas, ExcelJS
4. **Dynamic form data** (~10%): Form state, uncontrolled inputs
5. **Admin panel state** (~10%): Generic CRUD page state
6. **Drizzle service layer** (~10%): Service/repository return types

## Recommendations

### Phase 1 (Quick wins — 50% reduction)
1. Add Supabase generated types: `supabase gen types typescript > src/types/supabase.ts`
2. Replace `: any` on Supabase query results with `Tables<'orders'>` etc.
3. Create proper interfaces for report payloads (products, sales, dashboard)

### Phase 2 (Library types — 30% reduction)
4. Add proper Leaflet types (`@types/leaflet` already installed)
5. Create type wrappers for jsPDF/html2canvas/ExcelJS
6. Type Realtime channel payloads

### Phase 3 (Architecture — 20% reduction)
7. Add generic `CrudPageProps<T>` for admin CRUD pages
8. Create typed repository wrappers
