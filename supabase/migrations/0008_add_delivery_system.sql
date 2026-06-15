-- =============================================
-- Migration 0008: Delivery Zone & Location System
-- Safe migration — preserves all existing tables/columns
-- =============================================

-- 1. Create delivery_zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  base_fee        numeric NOT NULL DEFAULT 0,
  per_km_fee      numeric NOT NULL DEFAULT 0,
  max_distance_km numeric NOT NULL DEFAULT 15,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- 2. Seed default Sanaa zones
INSERT INTO delivery_zones (name, base_fee, per_km_fee, max_distance_km, is_active) VALUES
  ('أزال', 500, 200, 10, true),
  ('التحرير', 500, 200, 10, true),
  ('الثورة', 500, 200, 10, true),
  ('السبعين', 700, 250, 12, true),
  ('شعوب', 500, 200, 10, true),
  ('الصافية', 500, 200, 10, true),
  ('معين', 500, 200, 10, true),
  ('الوحدة', 500, 200, 10, true),
  ('بني الحارث', 800, 300, 15, true),
  ('صنعاء القديمة', 500, 200, 8, true),
  ('الروضة', 700, 250, 12, true),
  ('الحصبة', 600, 250, 12, true),
  ('حدة', 500, 200, 10, true),
  ('بيت بوس', 800, 300, 15, true)
ON CONFLICT DO NOTHING;

-- 3. Add latitude/longitude to branches (safe migration)
ALTER TABLE branches ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS longitude numeric;

-- 4. Add delivery location columns to orders (safe migration)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_latitude          numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_longitude         numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone              text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_distance_km       numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_duration_minutes  integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_verified          boolean DEFAULT false;

-- 5. Add index for delivery zones
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_location ON orders(delivery_latitude, delivery_longitude);
