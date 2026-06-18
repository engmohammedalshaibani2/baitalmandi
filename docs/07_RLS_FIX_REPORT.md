# RLS Fix Report — order_sequences

## CRITICAL Issue

- **Table:** `order_sequences`
- **RLS:** Enabled ✅
- **Policies:** ZERO ❌
- **Effect:** ALL order creation fails because `generateOrderNumber()` cannot upsert/read/update the sequence counter

## Root Cause

The `ALIER TABLE order_sequences ENABLE ROW LEVEL SECURITY` was added in the migration but no policies were created. The `generateOrderNumber()` function (server-side) uses the Supabase anon key, which is blocked by RLS when no policies exist.

## Fix Applied

### Migration `0018_add_order_sequences_rls.sql`

```sql
-- Allow any user to read sequence numbers
CREATE POLICY "Anyone can read order_sequences"
  ON order_sequences FOR SELECT USING (true);

-- Allow any user to insert new sequence dates
CREATE POLICY "Anyone can insert order_sequences"
  ON order_sequences FOR INSERT WITH CHECK (true);

-- Allow any user to update (optimistic locking via last_number)
CREATE POLICY "Anyone can update order_sequences"
  ON order_sequences FOR UPDATE USING (true) WITH CHECK (true);
```

### `src/db/rls.sql` Updated

Added the three policies under the `order_sequences` section.

## Security Rationale

`order_sequences` contains only a date and incrementing integer — no PII or sensitive data. Optimistic locking via `last_number = old_value` prevents race conditions. Sequence gaps are acceptable and expected.
