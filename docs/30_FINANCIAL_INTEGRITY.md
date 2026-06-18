# Financial Integrity Report

## Server-Side Price Validation

All monetary values are recalculated server-side — client values are NEVER trusted:

| Calculation | Trust Client? | Server Check |
|-------------|:---:|-------------|
| Subtotal | ❌ | Recalculated from item prices + offers |
| Delivery fee | ❌ | Recalculated from distance + settings |
| Tax amount | ❌ | Recalculated from subtotal |
| Total amount | ❌ | Recalculated as subtotal + delivery + tax |
| Offer prices | ❌ | Recalculated from offer rules |

## Transactional Safety

**Before fix:** 10 independent `supabase.insert()` calls — partial failure possible.
**After fix:** All writes in a single `db.transaction()` — atomic commit or rollback.

## Idempotency

**Before fix:** `idempotency_key` checked AFTER insert failure (race condition).
**After fix:** `idempotency_key` checked BEFORE any writes. Returns existing order on match.

## Financial Audit Trail

| Event | Logged Where | Status |
|-------|-------------|--------|
| Order created | `audit_logs` + `order_status_history` | ✅ |
| Order status changed | `order_status_history` | ✅ |
| Order cancelled | `order_status_history` | ✅ (manual) |
| Payment received | N/A (cash only) | ⚠️ Not applicable |
| Refund issued | N/A (no refund flow) | ❌ Not implemented |

## Known Gaps

| Gap | Risk | Fix |
|-----|------|-----|
| No payment gateway integration | Transactions are cash-only | Add transfer/wallet verification |
| No refund tracking | Can't process refunds | Add refund workflow |
| No discount limit enforcement | Manager could set 100% off | Add max discount validation |
| No order total consistency check | Total could differ from sum(items) | Add DB constraint or trigger |
| No periodic financial reconciliation | Discrepancies may go undetected | Add daily reconciliation report |

## Recommendations

1. Add max discount validation (e.g., max 50% per offer)
2. Add DB trigger that validates `total_amount = subtotal + delivery_fee + tax`
3. Implement basic financial reconciliation (daily sales vs orders)
4. Add refund/cancellation with financial adjustment tracking
