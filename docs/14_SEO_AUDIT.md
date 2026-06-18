# SEO Audit

## Root Layout Metadata (`src/app/layout.tsx`)

| Property | Present | Issue |
|----------|---------|-------|
| `title` (default) | ✅ | `بيت المندي | أصالة الطعم اليمني` |
| `title` (template) | ✅ | `%s | بيت المندي` |
| `description` | ✅ | Arabic restaurant description |
| `keywords` | ✅ | Array of Arabic keywords |
| `openGraph` | ⚠️ Partial | Missing `og:image`, `og:url`, `og:site_name` |
| `twitter` | ❌ Missing | No Twitter Card metadata |
| `robots` | ✅ | `index, follow` |
| `manifest` | ✅ | PWA manifest |
| `icons` | ✅ | Favicon + apple touch icon |
| `themeColor` | ✅ | Dark/light variants |

## Per-Page Metadata — ALL 21 PAGES MISSING

| Page | Own metadata? | generateMetadata? | Title |
|------|:---:|:---:|-------|
| `/` | ❌ | ❌ | Uses root default |
| `/menu` | ❌ | ❌ | Uses root default |
| `/cart` | ❌ | ❌ | Uses root default |
| `/contact` | ❌ | ❌ | Uses root default |
| `/gallery` | ❌ | ❌ | Uses root default |
| `/my-orders` | ❌ | ❌ | Uses root default |
| `/offline` | ❌ | ❌ | Uses root default |
| `/t/[token]` | ❌ | ❌ | Uses root default |
| `/track-order/[orderId]` | ❌ | ❌ | Uses root default |
| `/admin/*` (10 pages) | ❌ | ❌ | Uses root default |

## Critical SEO Gaps

| Gap | Impact | Fix |
|-----|--------|-----|
| No per-page metadata | All pages share same title/description | Add `metadata` export to each page |
| No JSON-LD structured data | No rich snippets in search results | Add `Restaurant` + `BreadcrumbList` schema |
| No sitemap.xml | Search engines can't discover all pages | Create `src/app/sitemap.ts` |
| No robots.txt | Can't disallow `/admin/` paths | Create `src/app/robots.ts` |
| No canonical URLs | Duplicate content risk | Add `alternates.canonical` |
| No `og:image` | Poor social share previews | Add default OG image |
| No Twitter Cards | Poor Twitter link previews | Add `twitter:card` metadata |

## Recommendations

1. Add per-page metadata for all public pages
2. Create JSON-LD `Restaurant` schema on homepage
3. Create `src/app/sitemap.ts` with all public routes + menu items
4. Create `src/app/robots.ts` with sitemap reference
5. Add `og:image` and `twitter:card` to root layout
6. Add `generateMetadata` for dynamic routes (`/t/[token]`, `/track-order/[orderId]`)
