-- =============================================
-- Migration 0010: Delivery Fee Snapshot Columns
-- Adds breakdown columns to orders table for
-- analytics & reporting on delivery fees.
-- Safe migration — preserves all existing columns
-- =============================================

-- 1. Add delivery fee snapshot columns to orders (safe migration)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS base_delivery_fee_amount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra_distance_km        numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra_fee_amount         numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS weather_fee_amount       numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS peak_fee_amount          numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS peak_percentage_used     numeric DEFAULT 0;

-- 2. Add peak_days setting to site_settings (if not already present)
INSERT INTO site_settings (setting_key, value) VALUES
  ('peak_days', '[]')
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Index for delivery analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_fee_snapshot ON orders(
  created_at, base_delivery_fee_amount, extra_distance_km,
  weather_fee_amount, peak_fee_amount
);
