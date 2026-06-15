-- ========================================================
-- Fix: تصحيح سياسات RLS للمشرفين
-- المشكلة: دالة is_admin() كانت تتحقق من id = auth.uid()
-- والصحيح هو auth_user_id = auth.uid()
-- ========================================================

-- تصحيح دالة التحقق من المشرف
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تصحيح دالة الحصول على دور المشرف
CREATE OR REPLACE FUNCTION get_admin_role() RETURNS text AS $$
DECLARE
  admin_role text;
BEGIN
  SELECT role INTO admin_role FROM admin_users WHERE auth_user_id = auth.uid();
  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- Fix: إضافة سياسة RLS للسماح للعامة بإضافة تقييمات
-- ========================================================

-- حذف السياسات القديمة للتقييمات (إذا كانت موجودة)
DROP POLICY IF EXISTS "Public can read reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

-- إعادة إنشاء السياسات بشكل صحيح
CREATE POLICY "Public can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage reviews" ON reviews USING (is_admin() AND get_admin_role() IN ('developer', 'manager'));

-- ========================================================
-- Fix: إضافة سياسات RLS لـ audit_logs و order_status_history
-- ========================================================

-- order_status_history
DROP POLICY IF EXISTS "Admins can view and insert order_status_history" ON order_status_history;
CREATE POLICY "Admins can view order_status_history" ON order_status_history FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert order_status_history" ON order_status_history FOR INSERT WITH CHECK (is_admin());

-- audit_logs
CREATE POLICY "Admins can view audit_logs" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (is_admin());
