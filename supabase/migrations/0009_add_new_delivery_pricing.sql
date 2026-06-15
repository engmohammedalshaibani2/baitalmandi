-- =============================================
-- Migration 0009: New Delivery Pricing System
-- Replaces zone-based pricing with distance-based + surcharges
-- Safe migration — preserves all existing tables/columns
-- =============================================

-- 1. Add new delivery pricing settings to site_settings (if not already present)
-- These are handled by the app via upsert, but we document them here:

-- base_delivery_fee        numeric  (e.g. 400)
-- included_distance_km     numeric  (e.g. 2)
-- extra_fee_per_km         numeric  (e.g. 100)
-- max_delivery_distance_km numeric  (e.g. 15)
-- enable_weather_fee       boolean  (default false)
-- weather_fee              numeric  (e.g. 200)
-- enable_peak_hours        boolean  (default false)
-- peak_start_time          text     (e.g. '12:00')
-- peak_end_time            text     (e.g. '14:00')
-- peak_percentage          numeric  (e.g. 20)

-- Insert default delivery pricing settings (safe upsert)
INSERT INTO site_settings (setting_key, value) VALUES
  ('base_delivery_fee', '400'),
  ('included_distance_km', '2'),
  ('extra_fee_per_km', '100'),
  ('max_delivery_distance_km', '15'),
  ('enable_weather_fee', 'false'),
  ('weather_fee', '200'),
  ('enable_peak_hours', 'false'),
  ('peak_start_time', '"12:00"'),
  ('peak_end_time', '"14:00"'),
  ('peak_percentage', '20')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Update existing delivery settings descriptions (keep for backward compat)
UPDATE site_settings SET value = '25' WHERE setting_key = 'max_delivery_distance_km' AND value IS NULL;
