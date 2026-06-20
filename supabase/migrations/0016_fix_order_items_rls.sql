-- ========================================================
-- Fix: RLS INSERT policy for order_items
-- ========================================================
-- المشكلة: RLS مفعل على جدول order_items ولكن لا يوجد
-- INSERT Policy للعامة (anon role). هذا يسبب خطأ:
--
--   new row violates row-level security policy for table "order_items"
--   (SQLSTATE: 42501)
--
-- عند محاولة إنشاء طلب جديد عبر createOrder().
--
-- الحل: إضافة INSERT Policy تسمح بإدراج عناصر الطلب
-- مع التحقق من أن order_id يشير إلى طلب موجود مسبقاً.
-- ========================================================

-- 1. ضمان تفعيل RLS على order_items (إذا لم يكن مفعلاً)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 2. إضافة INSERT Policy للعامة (anon + authenticated)
--    تسمح بإدراج عناصر الطلب إذا كان الطلب موجوداً مسبقاً
--    هذا يمنع إنشاء عناصر وهمية مرتبطة بطلبات غير موجودة
DROP POLICY IF EXISTS "Anyone can insert order_items" ON order_items;
CREATE POLICY "Anyone can insert order_items" ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id)
  );

-- ========================================================
-- ملاحظات أمنية:
-- ========================================================
-- ✅ Least Privilege: تسمح فقط بـ INSERT (وليس SELECT/UPDATE/DELETE)
-- ✅ التحقق من وجود الطلب: لا يمكن إدراج عناصر لطلبات غير موجودة
-- ✅ لا تؤثر على جداول أخرى
-- ✅ متوافقة مع سياسة orders الحالية (التي تسمح بالإدراج العام)
-- ✅ لا تحتاج Service Role Key
-- ❌ لا تسمح بقراءة عناصر الآخرين (SELECT لا يزال مقيداً)
-- ❌ لا تسمح بتعديل عناصر موجودة (UPDATE/DELETE لا يزالان مقيدين)
-- ========================================================
