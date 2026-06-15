-- ========================================================
-- Order Offers Layer (Snapshot System)
-- ========================================================
-- حفظ Snapshot كامل للعرض داخل الطلب عند إنشائه
-- بحيث تبقى بيانات الطلب والفاتورة صحيحة حتى لو تم
-- تعديل أو حذف العرض لاحقاً
-- ========================================================

-- 1. Order Offers (bundle snapshot at order time)
CREATE TABLE IF NOT EXISTS order_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  offer_id uuid, -- nullable: offer may be deleted later
  offer_name text NOT NULL,
  offer_type text NOT NULL,
  original_price numeric NOT NULL,
  discount_amount numeric NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 0,
  final_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Order Offer Items (bundle line items snapshot)
CREATE TABLE IF NOT EXISTS order_offer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_offer_id uuid NOT NULL REFERENCES order_offers(id) ON DELETE CASCADE,
  item_id uuid, -- nullable: item may be deleted later
  item_name text NOT NULL,
  size_label text DEFAULT 'عادي',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_offers_order_id ON order_offers(order_id);
CREATE INDEX IF NOT EXISTS idx_order_offers_offer_id ON order_offers(offer_id);
CREATE INDEX IF NOT EXISTS idx_order_offer_items_offer_id ON order_offer_items(order_offer_id);
