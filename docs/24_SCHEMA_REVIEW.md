# Schema Review

## Tables: 23

### Core Business (7)
`categories`, `items`, `item_prices`, `offers`, `offer_items`, `reviews`, `gallery_images`

### Order System (7)
`orders`, `order_items`, `order_status_history`, `order_offers`, `order_offer_items`, `order_sequences`, `customer_tokens`

### Auth & Admin (2)
`users`, `admin_users`

### Cart (2)
`cart_sessions`, `cart_items`

### App Config (3)
`site_settings`, `branches`, `delivery_zones`

### Audit & Reports (2)
`audit_logs`, `scheduled_reports`

## Foreign Keys: 15

All FKs are valid with no circular dependencies. Notable:
- `orders.customer_id` → `users.id` (nullable — anonymous orders)
- `orders.offer_id` → `offers.id` (nullable — multi-offer via order_offers)
- `order_offers.order_id` → `orders.id` ON DELETE CASCADE
- `order_offer_items.order_offer_id` → `order_offers.id` ON DELETE CASCADE

## Indexes: 41 (14 unique)

After cleanup, 7 duplicate indexes should be dropped → **34 indexes**

## Materialized Views: 5

`mv_daily_sales`, `mv_weekly_sales`, `mv_monthly_sales`, `mv_product_performance`, `mv_customer_summary`

All support `CONCURRENTLY` refresh.

## Enums: 7

`admin_role`, `offer_status`, `order_method`, `order_status`, `payment_method`, `audit_action`, `report_period`

## Schema Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| `site_settings.value` is JSONB but used as string everywhere | 🟡 MED | Cast properly or add text column |
| `order_items.subtotal` column exists but never populated | 🟢 LOW | Remove or populate |
| `orders.offer_id` FK is nullable but conflicts with multi-offer approach | 🟡 MED | Remove FK or make always null |
| No composite indexes for common queries (e.g., `orders(status, created_at)`) | 🟡 MED | Add composite indexes |
| `delivery_zones` table has no RLS policies | 🟡 MED | Add RLS (see 17_RLS_TABLES_AUDIT) |
