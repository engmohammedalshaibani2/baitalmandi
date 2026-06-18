# Image & Asset Audit

## Images in `public/`

| File | Status | Size | Used By |
|------|--------|------|---------|
| `logo.jpg` | **KEEP** | ~50KB | Layout (favicon), page.tsx (hero bg), Footer, Navbar, LoadingScreen, printReport |
| `logo.png` | **KEEP** | ~15KB | manifest.json (PWA icons 192+512), sw.js (notification icon) |
| `logo.ico` | **KEEP** | ~5KB | Default favicon |
| `logo-new.png` | **DELETE** | ~20KB | No references |
| `logo-new copy.png` | **DELETE** | ~20KB | Duplicate, no references |
| `logo.svg` | **DELETE** | ~2KB | Default Next.js starter, no references |
| `window.svg` | **DELETE** | ~1KB | Default Next.js starter, no references |
| `vercel.svg` | **DELETE** | ~1KB | Default Next.js starter, no references |
| `next.svg` | **DELETE** | ~1KB | Default Next.js starter, no references |
| `globe.svg` | **DELETE** | ~1KB | Default Next.js starter, no references |
| `file.svg` | **DELETE** | ~1KB | Default Next.js starter, no references |

## Next.js Image Component Usage

| Component | File | Priority | Placeholder | Issue |
|-----------|------|----------|-------------|-------|
| `<Image>` | LoadingScreen.tsx:21 | ✅ priority | ❌ none | OK for splash |
| `<Image>` | page.tsx:415 | ✅ priority | ❌ none | OK for hero |
| `<Image>` | Navbar.tsx:83 | ❌ lazy (default) | ❌ none | Should add blur placeholder |
| `<Image>` | Footer.tsx:48 | ❌ lazy (default) | ❌ none | Should add blur placeholder |

## Native `<img>` tags (non-optimized) — should convert to `<Image>`

| File | Lines | Content |
|------|-------|---------|
| `app/gallery/page.tsx` | 126, 169 | Unsplash gallery thumbnails + lightbox |
| `app/admin/offers/page.tsx` | 289, 464 | Offer images (admin) |
| `app/admin/menu/page.tsx` | 309 | Menu item images (admin) |
| `app/menu/page.tsx` | 185, 348 | Offer + menu item images |
| `app/page.tsx` | 331, 434 | Offer images + fallback hero |
| `app/admin/gallery/page.tsx` | 175 | Gallery images |
| `components/invoice/receipt-html.ts` | 120, 181 | Logo + QR (HTML invoice — OK to keep img) |
| `components/invoice/InvoiceModal.tsx` | 241 | Restaurant image |
| `lib/printReport.ts` | 93, 108 | Logo + QR (print — OK to keep img) |

## Recommendations

1. Add `placeholder="blur"` with `blurDataURL` to all `<Image>` components
2. Convert admin panel `<img>` tags to `<Image>` with `loading="lazy"`
3. Remove 8 unused files from `public/`
4. Add `sizes` attribute to all `<Image>` components for responsive loading
5. Consider WebP conversion for `logo.jpg`
