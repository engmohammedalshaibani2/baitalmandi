-- Fix materialized views for proper CONCURRENTLY refresh
-- Replaces ((true)) index with real row_id on mv_dashboard_metrics
-- Adds error-isolated refresh function

-- 1) Fix mv_dashboard_metrics: drop and recreate with row_id
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_metrics;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_metrics AS
SELECT
  1 AS row_id,
  COUNT(*)::bigint AS total_orders,
  COUNT(*) FILTER (WHERE status = 'pending')::bigint AS pending_orders,
  COUNT(*) FILTER (WHERE status = 'delivered')::bigint AS delivered_orders,
  COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS today_revenue,
  COALESCE(SUM(total_amount), 0) AS total_revenue
FROM orders
WHERE is_deleted = false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard ON mv_dashboard_metrics (row_id);

-- 2) Recreate refresh function with per-view error isolation
-- Each MV refresh is wrapped in its own block so one failure doesn't block the rest
CREATE OR REPLACE FUNCTION refresh_report_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[MV-REFRESH] mv_dashboard_metrics failed: %', SQLERRM;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_metrics;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[MV-REFRESH] mv_sales_metrics failed: %', SQLERRM;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_offer_metrics;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[MV-REFRESH] mv_offer_metrics failed: %', SQLERRM;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_metrics;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[MV-REFRESH] mv_customer_metrics failed: %', SQLERRM;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_metrics;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[MV-REFRESH] mv_product_metrics failed: %', SQLERRM;
  END;
END;
$$;
