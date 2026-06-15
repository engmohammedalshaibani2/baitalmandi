-- ========================================================
-- Add Variant Support to Offer Items
-- ========================================================
-- إضافة دعم الأحجام/الخيارات (variants) للباقات
-- بحيث يمكن تحديد حجم معين لكل منتج في الباقة
-- ========================================================

-- 1. Add variant columns to offer_items
ALTER TABLE offer_items ADD COLUMN IF NOT EXISTS price_id uuid REFERENCES item_prices(id);
ALTER TABLE offer_items ADD COLUMN IF NOT EXISTS variant_name text;
ALTER TABLE offer_items ADD COLUMN IF NOT EXISTS unit_price numeric;

-- 2. Backfill unit_price for existing offer_items
--    Uses MIN active price as fallback
DO $$
DECLARE
  oi RECORD;
  best_price numeric;
BEGIN
  FOR oi IN 
    SELECT id, menu_item_id 
    FROM offer_items 
    WHERE unit_price IS NULL
  LOOP
    SELECT COALESCE(
      (SELECT MIN(COALESCE(sale_price, original_price)) 
       FROM item_prices 
       WHERE item_id = oi.menu_item_id AND is_active = true),
      0
    ) INTO best_price;
    
    UPDATE offer_items 
    SET unit_price = best_price 
    WHERE id = oi.id;
  END LOOP;
END;
$$;

-- 3. Ensure future rows have a default
ALTER TABLE offer_items ALTER COLUMN unit_price SET DEFAULT 0;
ALTER TABLE offer_items ALTER COLUMN unit_price SET NOT NULL;
