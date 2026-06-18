# CSP Header Report

## Change Applied

Added `Content-Security-Policy-Report-Only` header to all routes in `next.config.js`.

### Report-Only Mode

The CSP is deployed in **Report-Only** mode (not enforced). This allows monitoring violations without blocking legitimate content.

### Policy Directives

| Directive | Sources | Rationale |
|-----------|---------|-----------|
| `default-src` | `'self'` | Base policy |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://unpkg.com https://cdn.jsdelivr.net` | Next.js needs unsafe-inline for inline scripts; Supabase for auth; unpkg/cdn for potential widget libs |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net` | Google Fonts + Tailwind JIT |
| `font-src` | `'self' https://fonts.gstatic.com data:` | Google Fonts rendering |
| `img-src` | `'self' data: blob: https://images.unsplash.com https://*.supabase.co https://unpkg.com` | Unsplash remote images, Supabase storage |
| `connect-src` | `'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://router.project-osrm.org` | Supabase REST+Realtime, OSM geocoding, OSRM routing |
| `frame-src` | `'none'` | No frames |
| `base-uri` | `'self'` | Prevent base tag injection |
| `form-action` | `'self'` | Form submissions only to self |
| `manifest-src` | `'self'` | PWA manifest |

### Violation Reporting

With Report-Only mode, violations are reported via browser console and to the `report-uri` / `report-to` endpoint (not yet configured).

### Next Steps

1. Monitor for 1 week in Report-Only mode
2. Collect all violation reports
3. Add missing origins to whitelist
4. Switch to enforced mode (`Content-Security-Policy`)
5. Set up `report-uri` or `report-to` endpoint
