-- Materialized Views for Reports
-- Eliminates live aggregations on orders, order_items, order_offers

-- 1) Dashboard metrics: total orders, today's revenue, pending count
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_metrics AS
SELECT
  COUNT(*)::bigint AS total_orders,
  COUNT(*) FILTER (WHERE status = 'pending')::bigint AS pending_orders,
  COUNT(*) FILTER (WHERE status = 'delivered')::bigint AS delivered_orders,
  COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS today_revenue,
  COALESCE(SUM(total_amount), 0) AS total_revenue
FROM orders
WHERE is_deleted = false;

-- 2) Sales metrics by day (for period-over-period comparison)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sales_metrics AS
SELECT
  DATE(created_at) AS sale_date,
  COUNT(*)::bigint AS order_count,
  COALESCE(SUM(total_amount), 0) AS revenue,
  COALESCE(SUM(delivery_fee), 0) AS delivery_fees,
  COUNT(*) FILTER (WHERE status = 'cancelled')::bigint AS cancelled_count,
  COUNT(*) FILTER (WHERE payment_method = 'cash')::bigint AS cash_orders,
  COUNT(*) FILTER (WHERE payment_method = 'transfer')::bigint AS transfer_orders,
  COUNT(*) FILTER (WHERE payment_method = 'wallet')::bigint AS wallet_orders
FROM orders
WHERE is_deleted = false
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- 3) Offer / bundle usage metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_offer_metrics AS
SELECT
  order_offers.offer_id,
  order_offers.offer_name,
  COUNT(DISTINCT order_offers.order_id)::bigint AS times_ordered,
  SUM(order_offers.quantity)::bigint AS total_units_sold,
  COALESCE(SUM(order_offers.original_price * order_offers.quantity), 0) AS gross_revenue,
  COALESCE(SUM(order_offers.discount_amount * order_offers.quantity), 0) AS total_discount_given,
  COALESCE(SUM(order_offers.final_price * order_offers.quantity), 0) AS net_revenue
FROM order_offers
JOIN orders ON orders.id = order_offers.order_id AND orders.is_deleted = false
GROUP BY order_offers.offer_id, order_offers.offer_name;

-- 4) Customer spending metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_customer_metrics AS
SELECT
  customer_name,
  customer_phone,
  COUNT(*)::bigint AS order_count,
  COALESCE(SUM(total_amount), 0) AS total_spent,
  COALESCE(AVG(total_amount), 0) AS avg_order_value,
  MAX(created_at) AS last_order_date,
  MIN(created_at) AS first_order_date
FROM orders
WHERE is_deleted = false
GROUP BY customer_name, customer_phone;

-- 5) Product / item sales metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_metrics AS
SELECT
  order_items.item_name,
  order_items.category_name,
  COUNT(DISTINCT order_items.order_id)::bigint AS times_ordered,
  SUM(order_items.quantity)::bigint AS total_quantity_sold,
  COALESCE(SUM(order_items.total_price), 0) AS total_revenue,
  COALESCE(AVG(order_items.unit_price), 0) AS avg_unit_price
FROM order_items
JOIN orders ON orders.id = order_items.order_id AND orders.is_deleted = false
GROUP BY order_items.item_name, order_items.category_name;

-- Unique indexes on materialized views for fast refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard ON mv_dashboard_metrics ((true));
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_date ON mv_sales_metrics (sale_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_offer_id ON mv_offer_metrics (offer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_customer_phone ON mv_customer_metrics (customer_phone, customer_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_name ON mv_product_metrics (item_name, category_name);

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_report_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_offer_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_metrics;
END;
$$;
