# API Review

## Server Actions (5)

| Action | File | Purpose | Transaction? | Security |
|--------|------|---------|:---:|----------|
| `createOrder` | `orders.ts` | Create order | ✅ Drizzle | Server-side validation |
| `getOrders` | `orders.ts` | List orders | N/A (read) | Supabase RLS |
| `getOrderById` | `orders.ts` | Get single order | N/A (read) | Supabase RLS |
| `calculateDeliveryFeeServer` | `orders.ts` | Preview delivery fee | N/A (read) | Server-side calc |
| `updateOrderStatus` | `orders.ts` | Change order status | ⚠️ No TX | Optimistic locking |

## API Routes: 14

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/auth/login` | POST | Admin login | None |
| `/api/resolve-zone` | POST | Resolve delivery zone | Public |
| `/api/reports/audit` | GET | Audit log report | Admin (CRON_SECRET) |
| `/api/reports/compare` | GET | Period comparison | Admin (CRON_SECRET) |
| `/api/reports/cron` | POST | Cron trigger | CRON_SECRET |
| `/api/reports/customers` | GET | Customer report | Admin (CRON_SECRET) |
| `/api/reports/dashboard` | GET | Dashboard metrics | Admin (CRON_SECRET) |
| `/api/reports/delivery-analytics` | GET | Delivery analytics | Admin (CRON_SECRET) |
| `/api/reports/invoices` | GET | Invoice data | Admin (CRON_SECRET) |
| `/api/reports/offers` | GET | Offer performance | Admin (CRON_SECRET) |
| `/api/reports/orders` | GET | Order report | Admin (CRON_SECRET) |
| `/api/reports/products` | GET | Product report | Admin (CRON_SECRET) |
| `/api/reports/refresh-mv` | POST | Refresh MVs | Admin (CRON_SECRET) |
| `/api/reports/sales` | GET | Sales report | Admin (CRON_SECRET) |
| `/api/reports/schedule` | POST | Schedule report | Admin (CRON_SECRET) |

## API Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| Report routes use CRON_SECRET, not proper auth | 🟡 MED | Add Supabase session check |
| No OpenAPI/Swagger docs | 🟢 LOW | Add in future |
| No rate limiting | 🟡 MED | Add middleware |
| No response caching headers | 🟢 LOW | Add `Cache-Control` for reports |
