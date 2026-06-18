# Transaction & Idempotency Refactor

## Changes to `src/actions/orders.ts`

### 1. Idempotency Check Moved Before Writes (Critical Bug Fix)

**Before:** Idempotency checked AFTER insert failure (line 468) — order was created first, THEN checked if duplicate. This meant:
- `idempotency_key` unique constraint triggered on every retry
- Wasted DB writes for duplicates
- Manual rollback on duplicate key error (race condition)

**After:** Idempotency checked BEFORE any DB writes (line ~190):
```ts
if (input.idempotency_key) {
  const existing = await db.select().from(orders)
    .where(eq(orders.idempotencyKey, input.idempotency_key))
    .limit(1);
  if (existing.length > 0) {
    return { ...existing[0], order_number: o.orderNumber, tracking_token: o.trackingToken };
  }
}
```

### 2. Drizzle Transaction for All Writes

**Before:** 10 independent `supabase.from().insert()` calls with manual rollback only for items failure.

**After:** All writes wrapped in a `db.transaction()`:
- `orders` INSERT
- `order_items` INSERT (batch)
- `order_status_history` INSERT
- `order_offers` INSERT (per offer, with cascade)
- `order_offer_items` INSERT (per bundle)
- `audit_logs` INSERT (new)

**Atomic rollback:** If any operation fails, ALL writes are rolled back. No partial orders.

### 3. Audit Log Added

On successful order creation, an `audit_logs` entry is created with:
- `entity_id`: order UUID
- `entity_type`: 'order'
- `action`: 'other'
- `details`: JSON with order_number, method, payment method, item count, total

### 4. Drizzle Integration

Added imports:
```ts
import { db } from '@/db';
import { orders, orderItems, orderStatusHistory, orderOffers, orderOfferItems, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
```

The Drizzle `db` uses the `postgres` driver with `DATABASE_URL` (service role), bypassing RLS. This is safe for server-side operations.

### 5. Customer Tokens (Outside Transaction)

Customer token upsert remains outside the transaction — it's an independent cross-cutting concern. If it fails, the order still exists and the user can still track via the token returned in the response.
