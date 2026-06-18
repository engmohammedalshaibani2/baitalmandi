# Performance Report

## Build Stats

| Metric | Value |
|--------|-------|
| Build success | ✅ 35/35 static pages |
| Largest page bundle | 428 kB (`/admin/reports`) |
| TypeScript strict | ✅ `strict: true` |
| Package optimization | ✅ `optimizePackageImports: ['lucide-react']` |

## Bundle Size Analysis

| Page | Estimated Size | Notes |
|------|---------------|-------|
| `/` (home) | ~150 KB | Hero images, gallery, reviews, Leaflet |
| `/menu` | ~200 KB | All items + prices + images |
| `/cart` | ~100 KB | Zustand + checkout form |
| `/admin/reports` | ~428 KB | Recharts, ExcelJS, jsPDF, html2canvas — LARGEST |
| `/admin/orders` | ~250 KB | Order list + Realtime subscription |
| `/admin/delivery` | ~200 KB | Leaflet map + zones |

## Performance Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| Leaflet loaded on ALL pages | Unnecessary on admin-only pages | Dynamic import with `next/dynamic` |
| Recharts loaded on non-report pages | ~50KB unused | Dynamic import |
| jsPDF + html2canvas in main bundle | ~100KB for PDF generation | Dynamic import |
| No `next/dynamic` usage anywhere | All components eagerly loaded | Audit and split |

## Recommendations

1. **Dynamic import Leaflet** — only load on pages with maps (`/`, `/admin/delivery`, `/test-map`)
2. **Dynamic import report libraries** — Recharts, ExcelJS, jsPDF, html2canvas only on `/admin/reports`
3. **Add `loading` and `suspense` boundaries** for heavy components
4. **Image optimization** — Ensure all images use Next.js `<Image>` with proper `sizes`
5. **Font optimization** — Google Fonts should use `display=swap` (already configured)
