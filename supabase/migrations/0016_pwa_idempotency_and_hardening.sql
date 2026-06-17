-- ============================================================
-- Migration 0016: PWA Production Hardening
-- Adds idempotency support + processing recovery for orders
-- ============================================================

-- 1. Add idempotency_key column to orders (nullable for backward compat)
--    The partial unique index ensures only non-null keys are checked,
--    so existing orders without a key are unaffected.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "idempotency_key" text;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_orders_idempotency_key"
  ON "orders"("idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

-- 2. Add processing_started_at to help detect orphaned in-flight mutations
--    (used by the background sync recovery scanner)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "processing_started_at" timestamp with time zone;

-- 3. RLS: allow insert with idempotency_key (admin + anon)
--    Existing RLS policies already cover orders; this just ensures
--    the new column is writable.
--    (No policy change needed — ALTER TABLE doesn't affect RLS)
