# Business Domain Audit

## Delivery Zones

**Status:** ⚠️ Needs verification
- `delivery_zones` table exists in schema but not in RLS coverage
- Zone-based pricing is not yet implemented
- Current delivery uses straight-line distance + OSRM routing
- Recommendations: Implement zone-based pricing for fixed delivery areas in Sana'a

## Offers System

**Status:** ✅ Fully functional
- Multi-offer support with `order_offers` and `order_offer_items` tables
- Offer types: percentage_discount, sale_price, fixed_discount
- Validation: active status, date range, bundle items
- Snapshot pricing at order time (historical accuracy)

## Reviews System

**Status:** ✅ Fully functional
- Public read (active reviews) + anyone can insert
- Admin approval workflow via `is_active` flag
- Feature toggle for homepage display
- Missing: rating aggregation, photo uploads

## Order Lifecycle

**Status:** ✅ Robust with recent fixes

| Stage | Status | Notes |
|-------|--------|-------|
| Cart → Order | ✅ | Server-side validation, delivery calc |
| Order creation | ✅ | Now transactional + idempotent |
| Payment (cash) | ✅ | Default method |
| Status transitions | ✅ | Version-based optimistic locking |
| Order tracking | ✅ | Token-based + ID-based tracking |
| Status history | ✅ | Full audit trail |
| Admin management | ✅ | Role-based (developer, manager, order_manager) |

## Reporting System

**Status:** ✅ Fully functional
- 14 API endpoints for reports
- 6 service modules (Drizzle-based analytics)
- 5 materialized views for performance
- Scheduled reports via cron
- Export to PDF, Excel

## Financial Integrity

**Status:** 🟡 Improved, still monitoring

| Check | Status |
|-------|--------|
| Server-side price validation | ✅ All prices recalculated server-side |
| Delivery fee recalculation | ✅ Never trusts client delivery_fee |
| Total amount recalculation | ✅ Never trusts client total_amount |
| Idempotency | ✅ Checked BEFORE writes now |
| Transaction atomicity | ✅ Drizzle transaction wraps all writes |
| Audit log | ✅ Added on order creation |
| Offer price validation | ✅ Validates offer active status and date range |

## Recommendations

1. Implement delivery zone pricing with fixed rates per Sana'a district
2. Add review photo upload (Supabase Storage)
3. Add rating aggregation (average rating per item)
4. Implement payment integration (if transfer/wallet needed)
5. Add order cancellation reason tracking
