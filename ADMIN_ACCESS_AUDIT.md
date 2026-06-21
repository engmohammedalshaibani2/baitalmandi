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
- يوجد `middleware.ts` في جذر المشروع يقوم باستدعاء `updateSession` من `src/utils/supabase/middleware.ts`.
- يتم جلب المستخدم والـ Role في الـ Middleware.
- يتم الاعتماد بشكل كبير على حماية Client Side عبر `src/app/admin/layout.tsx` الذي يحتوي على `'use client'` و `useEffect`، مما يعني أنه يتم عرض جزء من واجهة الإدارة قبل إكمال جلب بيانات المستخدم.

## 3. الثغرات المكتشفة
1. **تسريب واجهة المستخدم (UI Leakage)**: `layout.tsx` الخاص بالإضافة يعمل كـ Client Component. على الرغم من وجود حالة `loading`، قد تتمكن بعض مكونات Server Components الداخلية من معالجة البيانات قبل التحقق من الصلاحيات.
2. **غياب حماية Server Components**: ملفات مثل `src/app/admin/page.tsx` و `src/app/admin/orders/page.tsx` لا تقوم بأي فحص للصلاحيات من جانب الخادم (Server-Side Authorization). تعتمد فقط على الـ Client Side.
3. **التوجيه الخاطئ للـ Role**: لا توجد حماية قوية تمنع (order-manager) من طلب مكونات الخادم الخاصة بالصفحات غير المصرح بها إذا استطاع تخطي الـ Client.
4. **تعدد أماكن التحقق**: يتم فحص الـ Role في Middleware وفي Client Layout بدلاً من وجود مركزية حقيقية Server-Side.
5. **الوصول المباشر للـ API**: الـ API Routes لا تملك طبقة حماية موحدة قوية في معظم الأحيان تعتمد على Auth Helpers المتناثرة.

## 4. خطة الإصلاح
1. **نقل ملف الصلاحيات**: إنشاء `src/lib/auth/permissions.ts` وتوحيد كافة دوال التحقق (`getCurrentUserRole`, `isAdmin`, `isOrderManager`, `canAccessRoute`, `canAccessAdminPage`) به.
2. **حماية Server Components**: تعديل جميع ملفات `page.tsx` داخل مجلدات `/admin/*` لتقوم بفحص الجلسة والصلاحيات من الخادم.
3. **إعادة كتابة `admin/layout.tsx`**: جعله Server Component، ويستدعي `AdminLayoutClient` (مكون جديد) لتقديم واجهة المستخدم. الـ Server Layout سيقوم بالتحقق مرة واحدة ويمنع وصول أي مستخدم غير مسجل أو ليس لديه صلاحية للمكونات الداخلية.
4. **تحسين Middleware**: جعله يغطي كل شيء تحت `/admin` مع استثناء `/admin/login`.
5. **تسجيل الأحداث (Logger)**: إضافة نظام تسجيل (Logging) لمحاولات الدخول والتوجيه كما هو مطلوب في المرحلة التاسعة.
6. **حماية مسارات API**: إضافة فحص أمني مركزي لمسارات `/api/admin/*`.
