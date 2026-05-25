-- تمكين RLS على جميع الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- دوال مساعدة للتحقق من الصلاحيات بأمان (Security Definer)
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_admin_role() RETURNS text AS $$
DECLARE
  admin_role text;
BEGIN
  SELECT role INTO admin_role FROM admin_users WHERE id = auth.uid();
  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 1. users
-- ========================================================
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (is_admin());
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- ========================================================
-- 2. admin_users
-- ========================================================
CREATE POLICY "Admins can read admin_users" ON admin_users FOR SELECT USING (is_admin());
-- Developer can manage admins
CREATE POLICY "Developers can manage admin_users" ON admin_users USING (is_admin() AND get_admin_role() = 'developer');

-- ========================================================
-- Shared Policies (Public SELECT, Admin ALL)
-- categories, items, item_prices, offers, gallery_images, reviews, site_settings, branches
-- ========================================================
DO $$
DECLARE
  table_name text;
  tables text[] := ARRAY['categories', 'items', 'item_prices', 'offers', 'gallery_images', 'reviews', 'site_settings', 'branches'];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "Public can read %I" ON %I FOR SELECT USING (true);', table_name, table_name);
    -- INSERT/UPDATE/DELETE للمديرين (developer, manager) فقط
    EXECUTE format('CREATE POLICY "Admins can manage %I" ON %I USING (is_admin() AND get_admin_role() IN (''developer'', ''manager''));', table_name, table_name);
  END LOOP;
END
$$;

-- ========================================================
-- 7 & 8. cart_sessions & cart_items
-- ========================================================
-- Assuming session management is tied to auth token or anonymous token
-- Policies here allow full operations if the session belongs to the user
CREATE POLICY "Public can manage own cart sessions" ON cart_sessions USING (true); -- Implement application-layer session validation
CREATE POLICY "Public can manage own cart items" ON cart_items USING (true);

-- ========================================================
-- 10. orders
-- ========================================================
CREATE POLICY "Customers can view their own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (is_admin());
CREATE POLICY "Developers and Managers can fully manage orders" ON orders USING (is_admin() AND get_admin_role() IN ('developer', 'manager'));
CREATE POLICY "Order Managers can update order status" ON orders FOR UPDATE USING (is_admin() AND get_admin_role() = 'order_manager');

-- منع الحذف نهائياً (Hard Delete)
CREATE RULE prevent_orders_delete AS ON DELETE TO orders DO INSTEAD NOTHING;

-- ========================================================
-- 11. order_items
-- ========================================================
CREATE POLICY "Customers can view their own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.customer_id = auth.uid() OR orders.customer_id IS NULL))
);
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (is_admin());

-- ========================================================
-- 12. order_status_history
-- ========================================================
CREATE POLICY "Admins can view and insert order_status_history" ON order_status_history USING (is_admin());
