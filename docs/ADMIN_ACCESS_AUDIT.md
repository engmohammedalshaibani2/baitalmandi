# ADMIN_ACCESS_AUDIT.md

## 1. جميع صفحات الإدارة الموجودة
- `/admin` (الرئيسية)
- `/admin/login` (تسجيل الدخول)
- `/admin/categories`
- `/admin/delivery`
- `/admin/gallery`
- `/admin/menu`
- `/admin/offers`
- `/admin/orders`
- `/admin/reports`
- `/admin/reviews`
- `/admin/settings`

## 2. مستوى الحماية الحالي
- يتم استدعاء `updateSession` في الـ Middleware لحماية مسارات `/admin/*` و `/api/reports/*`.
- تحتوي صفحات `/admin/*` على فحص Server-Side عبر دالة `canAccessAdminPage` التي يتم استدعاؤها في كل ملف `page.tsx` قبل تحميل مكونات العميل.
- واجهة لوحة التحكم `layout.tsx` هي Server Component تقوم باستدعاء `canAccessAdminPage` لضمان حماية المخطط بالكامل.

## 3. الثغرات المكتشفة والمصلحة
- **خلل عدم مطابقة دور (order-manager)**: كان الدور في قاعدة البيانات يُخزن كـ `order_manager` (بالشرطة السفلية) أو قد يُدخل كـ `order-manager` (بالشرطة العادية)، بينما لم يكن الـ Middleware والـ Server Actions يُطبعان أو يُوحدان هذا الاسم بالكامل. تم حل ذلك بتطبيع الدور فور جلبه من قاعدة البيانات في Middleware و Server Actions والدوال المساعدة.
- **توجيه order-manager لصفحة الرئيسية**: إذا زار مدير الطلبات `/admin` أو أي صفحة غير مصرح بها، كان التوجيه يعيده لـ `/admin` مما يخلق مشكلة في التجربة أو خللاً أمنياً. تم تعديل الحماية لتوجه مدير الطلبات تلقائياً إلى `/admin/orders`.
- **تسريب استيرادات next/headers للـ Client**: كان المكون `AdminLayoutClient` يستورد من `src/lib/auth/permissions.ts` الذي يحتوي على استيراد لـ `createClient` من `src/utils/supabase/server.ts` الذي يستدعي بدوره `next/headers`. تسبب هذا في فشل الـ Build. تم حل هذا بفصل الصلاحيات غير المعتمدة على السيرفر في `src/lib/permissions.ts` وجعله آمناً للاستدعاء من جانب العميل والسيرفر على حد سواء.

## 4. خطة الإصلاح المنفذة
1. **تطوير `src/lib/permissions.ts`**: ليكون مستقلاً وآمناً للاستيراد من الـ Client والـ Server، ويحتوي على الصلاحيات وطرق الوصول.
2. **تحديث `src/lib/auth/permissions.ts`**: ليكون مخصصاً للعمليات من جانب السيرفر فقط (`getCurrentUserRole` و `canAccessAdminPage`) بالاعتماد على `@/lib/permissions`.
3. **تحديث `src/utils/supabase/middleware.ts`**: لتطبيع دور `order-manager` وتعديل التوجيهات لتشير لـ `/admin/orders`.
4. **تحديث Server Actions**: تعديل `getCurrentAdmin` و `checkAdminAccess` في `src/app/admin/orders/actions.ts` لتطبيع دور مدير الطلبات وتجنب الفشل في الصلاحيات.
5. **تحديث المخطط للعميل**: تعديل `AdminLayoutClient` ليستورد الصلاحيات من الملف الآمن.
