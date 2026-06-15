-- ========================================================
-- Tracking Token System
-- ========================================================
-- إضافة tracking_token لكل عميل للوصول الآمن لطلباته
-- ========================================================

-- 1. إضافة العمود (آمن: IF NOT EXISTS)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token text;

-- 2. إنشاء فهرس لتحسين أداء البحث بـ tracking_token
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);

-- 3. حشو tracking_token للطلبات القديمة
--    نفس رقم الهاتف يحصل على نفس التوكن
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT DISTINCT customer_phone 
    FROM orders 
    WHERE tracking_token IS NULL AND customer_phone IS NOT NULL AND customer_phone <> ''
  LOOP
    UPDATE orders 
    SET tracking_token = gen_random_uuid()::text 
    WHERE customer_phone = rec.customer_phone AND tracking_token IS NULL;
  END LOOP;
END;
$$;
