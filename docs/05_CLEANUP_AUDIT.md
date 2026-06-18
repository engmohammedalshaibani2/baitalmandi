# Cleanup Audit — Dead Code, Unused Packages, Console Logs

## Actions Taken

### Unused Packages Removed (npm uninstall)

| Package | Reason | Size Saved |
|---------|--------|------------|
| `@sentry/nextjs` | Zero imports, never initialized | ~500KB |
| `@upstash/redis` | Zero imports, no Redis usage | ~200KB |
| `posthog-js` | Zero imports, no analytics | ~300KB |
| `puppeteer-core` | Zero imports, no PDF gen usage | ~50MB+ |
| `nodemailer` | Zero imports, reports use inline SMTP | ~100KB |
| `marked` | Zero imports | ~200KB |
| `gsap` | Zero imports, Framer Motion used instead | ~500KB |
| `@types/qrcode` | Unused type package | ~10KB |
| `@types/rbush` | Unused type package | ~5KB |
| `fast-json-stable-stringify` | Could be replaced by native JSON | ~20KB |
| `file-saver` | Could use native `download` attribute | ~10KB |
| `dompurify` | Zero imports | ~100KB |
| `@types/dompurify` | Zero imports | ~5KB |

**Total: ~52MB+ removed from node_modules, 249 packages removed**

### Dead Source Files (awaiting deletion)

| File | Status | Reason |
|------|--------|--------|
| `public/logo-new.png` | Unused | Duplicate logo variant |
| `public/logo-new copy.png` | Unused | Duplicate of above |
| `public/logo.svg` | Unused | Default starter |
| `public/window.svg` | Unused | Default starter |
| `public/vercel.svg` | Unused | Default starter |
| `public/next.svg` | Unused | Default starter |
| `public/globe.svg` | Unused | Default starter |
| `public/file.svg` | Unused | Default starter |

### Console.log Audit

**137 console.log/error/warn calls across 18 files.** These include:
- Order creation debug logging (~30 calls in `orders.ts`)
- Delivery calculation debug logging (~10 calls)
- Offer processing debug logging (~15 calls)
- General error logging (should remain)
- Warning messages (should remain)

**Recommendation:** Remove customer-facing debug logs; keep error logging in catch blocks.
