# Dependency Audit

## Production Dependencies (After Cleanup)

| Package | Version | Purpose | Critical? |
|---------|---------|---------|:---------:|
| `@supabase/ssr` | ^0.3.0 | Supabase SSR auth | ✅ |
| `@supabase/supabase-js` | ^2.106.1 | Supabase client | ✅ |
| `@turf/turf` | ^7.3.5 | Geospatial calculations | ✅ |
| `drizzle-orm` | ^0.30.10 | ORM for reports | ✅ |
| `exceljs` | ^4.4.0 | Excel export | ⚠️ Reports only |
| `framer-motion` | ^11.2.6 | Animations | ⚠️ Replaceable with CSS |
| `html2canvas` | ^1.4.1 | PDF generation | ⚠️ Reports only |
| `jspdf` | ^4.2.1 | PDF generation | ⚠️ Reports only |
| `jspdf-autotable` | ^5.0.8 | PDF tables | ⚠️ Reports only |
| `leaflet` | ^1.9.4 | Maps | ⚠️ Only on 3 pages |
| `lucide-react` | ^0.379.0 | Icons | ✅ (tree-shakeable) |
| `next` | 14.2.3 | Framework | ✅ |
| `postgres` | ^3.4.4 | DB driver | ✅ |
| `qrcode` | ^1.5.4 | QR generation | ⚠️ |
| `qrcode.react` | ^4.2.0 | QR component | ⚠️ |
| `react` + `react-dom` | ^18.3.1 | UI library | ✅ |
| `recharts` | ^3.8.1 | Charts | ⚠️ Reports only |
| `xlsx` | ^0.18.5 | Excel alternative | ⚠️ Reports only |
| `zod` | ^4.4.3 | Validation | ✅ |
| `zustand` | ^4.5.2 | Cart state | ✅ |

## Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` ^5.4.5 | Type checking |
| `tailwindcss` ^3.4.3 | CSS framework |
| `drizzle-kit` ^0.21.4 | Migration management |
| `eslint` + `eslint-config-next` | Linting |
| `autoprefixer` + `postcss` | CSS processing |
| `dotenv` | Local env vars |
| `@types/*` (leaflet, node, react, nodemailer) | Type definitions |

## Bundle Size Risk

| Package | Min+gzip | Loaded on |
|---------|----------|-----------|
| `leaflet` | ~40 KB | Home, delivery, test-map |
| `recharts` | ~80 KB | Admin reports only |
| `exceljs` | ~100 KB | Admin reports only |
| `jspdf` + `html2canvas` | ~80 KB | Admin reports only |
| `@turf/turf` | ~150 KB | Home, delivery (route calc) |
| `framer-motion` | ~35 KB | All pages |

## Recommendations

1. Dynamic import leaflet, recharts, exceljs, jspdf, html2canvas (save ~300 KB on initial load)
2. Consider replacing `@turf/turf` with a smaller alternative (`haversine-distance` is 2 KB for just distance calc)
3. Consider replacing `framer-motion` with CSS animations for simpler transitions
4. Remove `xlsx` if `exceljs` is already used (both do the same thing)
