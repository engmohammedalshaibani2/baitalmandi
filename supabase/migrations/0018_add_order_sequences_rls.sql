-- Migration 0018: Fix order_sequences RLS lockout
-- CRITICAL: order_sequences has RLS enabled but ZERO policies, blocking ALL order creation

-- Allow any authenticated/anonymous user to read sequence numbers
CREATE POLICY "Anyone can read order_sequences"
  ON order_sequences
  FOR SELECT
  USING (true);

-- Allow any authenticated/anonymous user to insert new sequence dates
CREATE POLICY "Anyone can insert order_sequences"
  ON order_sequences
  FOR INSERT
  WITH CHECK (true);

-- Allow any authenticated/anonymous user to update sequence numbers (optimistic locking via last_number)
CREATE POLICY "Anyone can update order_sequences"
  ON order_sequences
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
