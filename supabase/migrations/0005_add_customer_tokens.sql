-- ========================================================
-- Customer Tracking Tokens (Independent Token Layer)
-- ========================================================
-- نقل tracking_token من orders إلى جدول منفصل customer_tokens
-- بحيث يكون لكل رقم هاتف توكن واحد ثابت لا يتغير أبداً
-- ========================================================

-- 1. Create customer_tokens table
CREATE TABLE IF NOT EXISTS customer_tokens (
  phone text PRIMARY KEY,
  tracking_token text NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamptz DEFAULT now()
);

-- 2. Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_customer_tokens_token ON customer_tokens(tracking_token);

-- 3. Backfill from existing orders
INSERT INTO customer_tokens (phone, tracking_token)
SELECT DISTINCT customer_phone, tracking_token
FROM orders
WHERE customer_phone IS NOT NULL AND customer_phone <> '' AND tracking_token IS NOT NULL
ON CONFLICT (phone) DO NOTHING;

-- 4. Generate tokens for orders without customer_tokens entry
INSERT INTO customer_tokens (phone, tracking_token)
SELECT DISTINCT customer_phone, gen_random_uuid()::text
FROM orders
WHERE customer_phone IS NOT NULL AND customer_phone <> ''
  AND customer_phone NOT IN (SELECT phone FROM customer_tokens)
ON CONFLICT (phone) DO NOTHING;
