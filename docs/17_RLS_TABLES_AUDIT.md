# RLS Tables Audit — Unprotected Tables

## Current RLS Coverage

### Tables WITH RLS (16)
`users`, `admin_users`, `categories`, `items`, `item_prices`, `offers`, `cart_sessions`, `cart_items`, `order_sequences` (FIXED), `orders`, `order_items`, `order_status_history`, `gallery_images`, `reviews`, `site_settings`, `branches`

### Tables WITHOUT RLS (7)

| Table | Sensitivity | Risk | Action |
|-------|------------|------|--------|
| `audit_logs` | **HIGH** — contains admin actions | Unauthorized read/write | Add RLS: admins only |
| `customer_tokens` | **HIGH** — order tracking tokens | Token theft | Add RLS: own token read, admin all |
| `order_offers` | **MEDIUM** — order pricing snapshots | Data leak | Add RLS: own order read, admin all |
| `order_offer_items` | **MEDIUM** — order bundle details | Data leak | Add RLS: own order read, admin all |
| `delivery_zones` | **LOW** — delivery area definitions | Low risk | Add RLS: public read, admin write |
| `scheduled_reports` | **LOW** — report scheduling | Low risk | Add RLS: admin only |
| `report_logs` | **LOW** — report execution logs | Low risk | Add RLS: admin only |

## Recommended Policies

```sql
-- audit_logs: admins only
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit_logs" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (is_admin());

-- customer_tokens: customer reads own, admin all
ALTER TABLE customer_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can read own token" ON customer_tokens FOR SELECT USING (phone = current_setting('request.jwt.claims')::json->>'phone');
CREATE POLICY "System can insert tokens" ON customer_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage tokens" ON customer_tokens USING (is_admin());

-- order_offers: owned by order
ALTER TABLE order_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own order read" ON order_offers FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_offers.order_id)
);
CREATE POLICY "Admins manage" ON order_offers USING (is_admin());

-- delivery_zones: public read
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON delivery_zones FOR SELECT USING (true);
CREATE POLICY "Admins manage" ON delivery_zones USING (is_admin());
```

## Priority

| Priority | Table | Reason |
|----------|-------|--------|
| 🔴 HIGH | `audit_logs`, `customer_tokens` | Contains sensitive data |
| 🟡 MEDIUM | `order_offers`, `order_offer_items` | Order data exposure |
| 🟢 LOW | `delivery_zones`, `scheduled_reports`, `report_logs` | Low sensitivity |
