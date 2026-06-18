# Database Cleanup Report

## Duplicate Indexes (7 duplicate pairs)

| Index | Duplicate Of | Recommendation |
|-------|-------------|----------------|
| `idx_orders_status` | `orders_status_idx` | Drop `idx_orders_status` |
| `idx_orders_created_at` | `orders_created_at_idx` | Drop `idx_orders_created_at` |
| `idx_order_items_order_id` | `order_items_order_id_idx` | Drop `idx_order_items_order_id` |
| `idx_offers_status` | `offers_status_idx` | Drop `idx_offers_status` |
| `idx_offers_is_active` | `offers_is_active_idx` | Drop `idx_offers_is_active` |
| `idx_categories_slug` | `categories_slug_key` (unique) | Drop `idx_categories_slug` |
| `idx_order_sequences_date` | `order_sequences_sequence_date_key` (unique) | Drop `idx_order_sequences_date` |

## Migration Journal Issues

| Issue | Detail |
|-------|--------|
| Migrations total | 18 (0000–0017) |
| Tracked in journal | 2 (0000, 0001) |
| Untracked | 16 (0002–0017) |
| Risk | HIGH — cannot run `drizzle-kit migrate` reliably |

**Fix:** Update `_journal.json` to include all 18 migrations with correct checksums.

## Materialized Views (5)

| View | Concurrent Refresh | Status |
|------|:---:|--------|
| `mv_daily_sales` | ✅ | Active |
| `mv_weekly_sales` | ✅ | Active |
| `mv_monthly_sales` | ✅ | Active |
| `mv_product_performance` | ✅ | Active |
| `mv_customer_summary` | ✅ | Active |

All MVs support `CONCURRENTLY` refresh — no table locks during refresh.

## Recommendations

1. Create migration `0019_cleanup_duplicate_indexes.sql` to drop 7 duplicate indexes
2. Regenerate `_journal.json` with correct entries for all 18 migrations
3. Add unique constraint on `order_sequences.sequence_date` (already exists — drop duplicate index)
4. Verify all MVs are refreshed on a schedule via cron
