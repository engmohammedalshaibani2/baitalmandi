-- ========================================================
-- Add quantity column to order_offers for bundle quantity tracking
-- ========================================================
-- كانت المشكلة أن order_offers لا يحتوي على quantity
-- مما يؤدي إلى فقدان كمية الباقة أثناء دورة الطلب
-- ========================================================

ALTER TABLE order_offers ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;

-- تحديث جميع السجلات الموجودة لتعيين quantity = 1 (القيمة الافتراضية)
UPDATE order_offers SET quantity = 1 WHERE quantity IS NULL;

COMMENT ON COLUMN order_offers.quantity IS 'عدد مرات تكرار الباقة (كمية الباقة في الطلب)';
