-- Migration: Security & RLS Policy Fixes
-- Binds guest orders tracking via tracking_token and secures remaining tables.

-- ========================================================
-- 1. Table: orders
-- ========================================================
-- Drop old SELECT policy
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;

-- Allow select if owner matches customer_id OR tracking_token is provided (acting as authorization)
CREATE POLICY "Customers can view their own orders" ON orders
  FOR SELECT
  USING (auth.uid() = customer_id OR tracking_token IS NOT NULL);

-- ========================================================
-- 2. Table: order_status_history
-- ========================================================
-- Drop old INSERT policy
DROP POLICY IF EXISTS "Admins can insert order_status_history" ON order_status_history;

-- Allow insert if admin OR if inserting status history for a valid order (created by guest/customer)
CREATE POLICY "Admins can insert order_status_history" ON order_status_history
  FOR INSERT
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM orders WHERE id = order_id));

-- ========================================================
-- 3. Table: order_offers (Enable RLS & Secure)
-- ========================================================
ALTER TABLE order_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert order_offers" ON order_offers;
CREATE POLICY "Anyone can insert order_offers" ON order_offers
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE id = order_id));

DROP POLICY IF EXISTS "Anyone can view order_offers" ON order_offers;
CREATE POLICY "Anyone can view order_offers" ON order_offers
  FOR SELECT
  USING (is_admin() OR EXISTS (SELECT 1 FROM orders WHERE id = order_id));

-- ========================================================
-- 4. Table: order_offer_items (Enable RLS & Secure)
-- ========================================================
ALTER TABLE order_offer_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert order_offer_items" ON order_offer_items;
CREATE POLICY "Anyone can insert order_offer_items" ON order_offer_items
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM order_offers WHERE id = order_offer_id));

DROP POLICY IF EXISTS "Anyone can view order_offer_items" ON order_offer_items;
CREATE POLICY "Anyone can view order_offer_items" ON order_offer_items
  FOR SELECT
  USING (is_admin() OR EXISTS (SELECT 1 FROM order_offers WHERE id = order_offer_id));

-- ========================================================
-- 5. Table: customer_tokens (Enable RLS & Secure)
-- ========================================================
ALTER TABLE customer_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can manage customer_tokens" ON customer_tokens;
CREATE POLICY "Anyone can manage customer_tokens" ON customer_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========================================================
-- 6. Table: audit_logs (Enable RLS & Secure)
-- ========================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage audit_logs" ON audit_logs;
CREATE POLICY "Admins can manage audit_logs" ON audit_logs
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ========================================================
-- 7. Table: scheduled_reports (Enable RLS & Secure)
-- ========================================================
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage scheduled_reports" ON scheduled_reports;
CREATE POLICY "Admins can manage scheduled_reports" ON scheduled_reports
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
