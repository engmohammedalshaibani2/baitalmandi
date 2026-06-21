# BUILD_ERROR_ROOT_CAUSE.md

## 1. المشكلة الحقيقية (Root Cause)
فشل بناء تطبيق Next.js مع إرجاع الخطأ التالي:
`You're importing a component that needs next/headers`

تتبع مسار الاستيراد (Import Trace):
```
src/utils/supabase/server.ts (بيئة السيرفر)
└── src/lib/auth/permissions.ts (يستورد createClient لقراءة الكوكيز)
    └── src/app/admin/AdminLayoutClient.tsx (Client Component - 'use client')
```

في Next.js App Router، يُمنع تماماً استيراد أي ملف أو دالة تعتمد على `next/headers` أو `cookies()` داخل أي مكون عهود للعميل (`'use client'`). نظراً لأن `AdminLayoutClient.tsx` كان يستورد `getAllowedSidebarLinks` من `src/lib/auth/permissions.ts` (الذي يستورد بدوره `createClient` من السيرفر)، قام Webpack بمحاولة تضمين ملفات السيرفر في حزمة العميل، مما تسبب في إيقاف وبتر عملية الـ Build بالكامل.

## 2. الملفات المسببة للمشكلة
- `src/app/admin/AdminLayoutClient.tsx` (مكون العميل)
- `src/lib/auth/permissions.ts` (مزيج بين منطق السيرفر ومنطق الصلاحيات العام)

## 3. خطة ومسار الإصلاح (Remediation)
1. **عزل الحدود (Boundary Isolation)**: قمنا بفصل المكونات العامة والصلاحيات الإستاتيكية التي يحتاج إليها العميل (مثل قائمة المسارات المسموح بها، أسماء الروابط، ودوال التحقق البسيطة مثل `isAdmin` و `isOrderManager`) ووضعها في ملف آمن تماماً لا يستورد أي شيء من السيرفر وهو `src/lib/permissions.ts`.
2. **تطهير مكونات العميل**: قمنا بتعديل استيرادات `AdminLayoutClient.tsx` لتشير إلى `src/lib/permissions.ts` بدلاً من `src/lib/auth/permissions.ts`.
3. **حصر بيئة السيرفر**: قمنا بقصر ملف `src/lib/auth/permissions.ts` على العمليات الخلفية فقط (توليد الـ Supabase Client والتحقق وقراءة جلسة المستخدم والتوجيه) واستيراد القواعد الأساسية من `@/lib/permissions`.

بهذا الإصلاح تم عزل السيرفر عن العميل بالكامل ونجح البناء `npm run build` بنسبة 100%.
