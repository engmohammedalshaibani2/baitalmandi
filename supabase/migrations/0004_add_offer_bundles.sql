-- ========================================================
-- Bundle Offers System
-- ========================================================
-- إضافة دعم الباقات والعروض المركبة
-- ========================================================

-- 1. إنشاء جدول offer_items لربط العروض بعدة منتجات
CREATE TABLE IF NOT EXISTS offer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_offer_items_offer_id ON offer_items(offer_id);

-- 2. إضافة أعمدة جديدة لجدول offers
ALTER TABLE offers ADD COLUMN IF NOT EXISTS offer_type text NOT NULL DEFAULT 'percentage_discount';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS discount_amount numeric;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3. حشو offer_type للعروض القديمة
UPDATE offers SET offer_type = 'percentage_discount' WHERE offer_type IS NULL;
