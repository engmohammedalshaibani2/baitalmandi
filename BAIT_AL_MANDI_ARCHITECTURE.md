# توثيق النظام الكامل — مطعم بيت المندي

## Bait Al Mandi — Full-Stack Architecture Documentation

---

# القسم الأول: تعريف النظام

## 1.1 ما هو بيت المندي؟

نظام إدارة مطعم متكامل لمطعم **بيت المندي** (Bait Al Mandi) — مطعم يمني في **صنعاء، اليمن**. يقدم النظام:
- **موقع عام** (Landing Page, Menu, Cart, Ordering, Tracking)
- **لوحة إدارة** (Dashboard, Orders, Menu CRUD, Categories, Offers, Gallery, Reviews, Reports, Delivery Settings, Site Settings)
- **نظام توصيل** (تسعير المسافة، رسوم الطقس والذروة، OSRM Routing، الخريطة)
- **نظام فواتير** (PNG, PDF, طباعة مباشرة، QR Code للتتبع)
- **نظام عروض وباقات** (Pricing Engine: سعر ثابت، خصم نسبة، خصم مبلغ، منتج مجاني)
- **نظام تتبع الطلبات** (Tracking Token فريد لكل زبون، QR Code)
- **تقارير وتحليلات** (12 API route + تبويبات واجهة + طباعة + Excel)

## 1.2 المشكلة والحل

| المشكلة | الحل |
|---------|------|
| إدارة المطعم بدون نظام رقمي | نظام كامل من الطلب إلى التوصيل إلى التقارير |
| توصيل بدون خرائط أو تسعير عادل | OSRM Routing + تسعير المسافة + رسوم طقس/ذروة |
| فواتير ورقية تقليدية | فواتير PNG/PDF/طباعة مع QR Tracking |
| عروض معقدة بدون محرك تسعير | Pricing Engine بـ 4 أنواع عروض |
| صعوبة تتبع الطلبات | Tracking Token + صفحة تتبع لكل زبون |

## 1.3 التقنيات المستخدمة (Tech Stack)

- **Framework**: Next.js 14.2.3 (App Router)
- **Language**: TypeScript 5.4.5
- **Styling**: Tailwind CSS + CSS Modules
- **Database**: Supabase (PostgreSQL 15)
- **ORM**: Drizzle ORM + Supabase REST (dual access)
- **Auth**: Supabase Auth (email/password) + Row Level Security
- **State (Client)**: Zustand (cartStore) + React Context (Settings)
- **Charts**: Recharts
- **Maps**: Leaflet + OSRM (routing)
- **GIS**: Turf.js + RBush (R-Tree spatial indexing)
- **PDF/PNG**: jsPDF + html2canvas + QRCode.react
- **Excel**: ExcelJS
- **Animations**: Framer Motion + GSAP
- **Email**: Nodemailer

## 1.4 الإصدارات الرئيسية

| الملف | الإصدار |
|-------|---------|
| Next.js | `^14.2.3` |
| React | `^18.3.1` |
| Supabase SSR | `^0.5.1` |
| Drizzle ORM | `^0.30.10` |
| Zustand | `^5.0.0` |

---

# القسم الثاني: بنية المجلدات

```
baitalmandiwibapp/
├── src/
│   ├── actions/          # Server Actions (RSC mutations)
│   │   ├── categories.ts     # CRUD التصنيفات
│   │   ├── items.ts          # CRUD الأطباق والأسعار
│   │   ├── orders.ts         # إنشاء الطلبات + حساب التوصيل + تحديث الحالة
│   │   └── orders-offers.ts  # جلب معلومات العروض للطلب
│   │
│   ├── app/              # App Router (pages + API)
│   │   ├── page.tsx          # Landing Page الرئيسية
│   │   ├── layout.tsx        # Root Layout (Navbar, Footer, SettingsProvider)
│   │   ├── globals.css       # التنسيقات العامة (Custom Properties)
│   │   ├── page.module.css   # CSS Module للصفحة الرئيسية
│   │   ├── favicon.ico
│   │   │
│   │   ├── menu/page.tsx     # صفحة المنيو (عرض + بحث + سلة)
│   │   ├── cart/page.tsx     # سلة المشتريات (قديمة)
│   │   ├── my-orders/page.tsx # سلة المشتريات + الخريطة + الطلب الكامل
│   │   ├── contact/page.tsx  # صفحة الاتصال + إرسال تقييم
│   │   ├── gallery/page.tsx  # معرض الصور
│   │   ├── test-map/page.tsx # صفحة اختبار الخريطة
│   │   ├── t/[token]/page.tsx# تتبع الطلب بالـ tracking token
│   │   ├── track-order/[orderId]/page.tsx # تتبع الطلب بـ UUID
│   │   │
│   │   ├── admin/            # لوحة الإدارة
│   │   │   ├── layout.tsx        # Admin Layout (Sidebar + Auth)
│   │   │   ├── page.tsx          # Dashboard الرئيسي
│   │   │   ├── login/page.tsx    # صفحة تسجيل الدخول
│   │   │   ├── login/actions.ts  # Server Actions للدخول/الخروج
│   │   │   ├── orders/page.tsx   # إدارة الطلبات
│   │   │   ├── orders/actions.ts # Server Actions للطلبات
│   │   │   ├── menu/page.tsx     # CRUD الأطباق
│   │   │   ├── categories/page.tsx # CRUD التصنيفات
│   │   │   ├── offers/page.tsx   # CRUD العروض والباقات
│   │   │   ├── gallery/page.tsx  # إدارة المعرض
│   │   │   ├── reviews/page.tsx  # إدارة التقييمات
│   │   │   ├── reports/page.tsx  # التقارير (9 تبويبات)
│   │   │   ├── delivery/page.tsx # إعدادات التوصيل
│   │   │   └── settings/page.tsx # إعدادات الموقع
│   │   │
│   │   └── api/             # API Routes
│   │       ├── auth/login/route.ts
│   │       ├── resolve-zone/route.ts
│   │       └── reports/
│   │           ├── dashboard/route.ts
│   │           ├── orders/route.ts
│   │           ├── products/route.ts
│   │           ├── customers/route.ts
│   │           ├── compare/route.ts
│   │           ├── offers/route.ts
│   │           ├── invoices/route.ts
│   │           ├── audit/route.ts
│   │           ├── sales/route.ts
│   │           ├── delivery-analytics/route.ts
│   │           ├── cron/route.ts
│   │           └── schedule/route.ts
│   │
│   ├── components/
│   │   ├── admin/reports/    # مكونات التقارير (9 تبويبات)
│   │   │   ├── DashboardTab.tsx
│   │   │   ├── OrdersTab.tsx
│   │   │   ├── ProductsTab.tsx
│   │   │   ├── CustomersTab.tsx
│   │   │   ├── SummaryTab.tsx
│   │   │   ├── OffersTab.tsx
│   │   │   ├── InvoicesTab.tsx
│   │   │   ├── AuditLogsTab.tsx
│   │   │   └── DeliveryAnalyticsTab.tsx
│   │   ├── invoice/
│   │   │   ├── InvoiceModal.tsx     # مودال الفاتورة (PNG/PDF)
│   │   │   └── receipt-html.ts     # HTML الفاتورة للطباعة
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx
│   │       └── LoadingScreen.tsx
│   │
│   ├── context/          # (مجلد فارغ حالياً)
│   │
│   ├── db/
│   │   ├── index.ts          # Drizzle ORM initialization
│   │   ├── schema.ts         # الـ Schema الكامل (22 جدول)
│   │   └── rls.sql           # Row Level Security policies
│   │
│   ├── lib/
│   │   ├── supabase.ts       # Supabase Client (Browser)
│   │   ├── permissions.ts    # نظام الصلاحيات (3 أدوار)
│   │   ├── constants.ts      # الثوابت (جهات الاتصال)
│   │   ├── settings-context.tsx # React Context للإعدادات
│   │   ├── delivery-pricing.ts   # المصدر الوحيد لحساب رسوم التوصيل
│   │   ├── delivery-routing.ts   # OSRM Routing + fallback
│   │   ├── delivery-zones.ts     # (قديم) نظام المناطق
│   │   ├── offer-pricing.ts      # محرك تسعير العروض
│   │   ├── bundle-utils.ts       # استخراج معلومات الباقات
│   │   ├── location-validation.ts # التحقق من موقع صنعاء
│   │   ├── exportExcel.ts        # تصدير Excel
│   │   ├── printReport.ts        # طباعة التقارير
│   │   └── geo/
│   │       ├── resolve-location.ts # (قديم) محرك تحديد المنطقة
│   │       ├── resolve-zone.ts     # (قديم) حل المنطقة مع Nominatim
│   │       └── sanaa-boundaries.ts # (قديم) حدود صنعاء GeoJSON
│   │
│   ├── middleware.ts         # Next.js Middleware (Admin Routes)
│   ├── types.d.ts            # أنواع TypeScript العامة
│   │
│   ├── services/reports/     # محرك التقارير (Drizzle-based)
│   │   ├── salesReport.ts
│   │   ├── analyticsEngine.ts
│   │   ├── customerReport.ts
│   │   ├── dashboardReport.ts
│   │   ├── ordersReport.ts
│   │   └── productReport.ts
│   │
│   ├── store/
│   │   └── cartStore.ts      # Zustand store (مستمر في localStorage)
│   │
│   └── utils/supabase/       # Supabase utilities
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
│
├── supabase/migrations/      # 11 SQL Migrations
│   ├── 0000_small_ozymandias.sql
│   ├── 0001_remarkable_terrax.sql
│   ├── 0002_fix_rls_policies.sql
│   ├── 0003_add_tracking_token.sql
│   ├── 0004_add_offer_bundles.sql
│   ├── 0005_add_customer_tokens.sql
│   ├── 0006_add_order_offers.sql
│   ├── 0007_add_variant_to_offers.sql
│   ├── 0008_add_delivery_system.sql
│   ├── 0009_add_new_delivery_pricing.sql
│   └── 0010_add_delivery_snapshot.sql
│
├── sanaa-map-integration/    # بيانات GeoJSON لصنعاء
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── eslint.config.mjs
└── .env.local
```

---

# القسم الثالث: قاعدة البيانات

## 3.1 الجداول الرئيسية (22 جدولاً)

| # | الجدول | الوصف | حقول المفاتيح |
|---|--------|-------|---------------|
| 1 | `users` | عملاء المطعم | `id` (PK), `full_name`, `phone` (UK), `address` |
| 2 | `admin_users` | حسابات الإدارة | `id` (PK), `email` (UK), `full_name`, `role` (enum), `auth_user_id` |
| 3 | `categories` | تصنيفات المنيو | `id` (PK), `name_ar/en`, `slug` (UK), `sort_order`, `is_active` |
| 4 | `items` | الأطباق | `id` (PK), `category_id` (FK→categories), `name_ar/en`, `is_best_seller`, `is_available` |
| 5 | `item_prices` | أسعار الأطباق (متغيرات) | `id` (PK), `item_id` (FK→items), `size_label_ar/en`, `original_price`, `sale_price` |
| 6 | `offers` | العروض والباقات | `id` (PK), `item_id` (FK→items), `offer_type`, `discount_percent/amount`, `sale_price` |
| 7 | `offer_items` | مكونات الباقة | `id` (PK), `offer_id` (FK→offers), `menu_item_id` (FK→items), `quantity`, `price_id`, `unit_price` |
| 8 | `cart_sessions` | جلسات السلة (قديم) | `id` (PK), `session_id` (UK), `phone`, `expires_at` |
| 9 | `cart_items` | عناصر السلة (قديم) | `id` (PK), `session_id` (FK→cart_sessions), `item_id`, `price_id`, `quantity` |
| 10 | `order_sequences` | تسلسل أرقام الطلبات | `id` (PK), `sequence_date` (UK), `last_number` |
| 11 | `orders` | 🔴 **الجدول الأساسي** | `id` (PK), `order_number` (UK), `customer_name/phone`, `tracking_token`, `subtotal/delivery_fee/total_amount`, `status` (enum), `version`, `delivery_*` (9 حقول)، snapshot fields (5) |
| 12 | `order_items` | عناصر الطلب | `id` (PK), `order_id` (FK→orders), `category_name`, `item_name`, `size_label`, `unit_price`, `total_price` |
| 13 | `order_status_history` | سجل تغيير الحالة | `id` (PK), `order_id` (FK→orders), `old/new_status`, `changed_by_admin_id` |
| 14 | `order_offers` | لقطة العرض عند الطلب | `id` (PK), `order_id` (FK→orders, CASCADE), `offer_name`, `original/final_price`, `discount_amount/percent` |
| 15 | `order_offer_items` | لقطة مكونات الباقة | `id` (PK), `order_offer_id` (FK→order_offers, CASCADE), `item_name`, `unit_price` |
| 16 | `gallery_images` | معرض الصور | `id` (PK), `image_url`, `caption_ar/en`, `sort_order`, `is_active` |
| 17 | `reviews` | تقييمات العملاء | `id` (PK), `reviewer_name`, `rating`, `comment_ar/en`, `is_featured` |
| 18 | `site_settings` | ⚙️ **إعدادات الموقع (key-value)** | `id` (PK), `setting_key` (UK), `value` (jsonb) |
| 19 | `branches` | فروع المطعم | `id` (PK), `name_ar/en`, `address`, `phone` |
| 20 | `audit_logs` | سجل تدقيق الإدارة | `id` (PK), `entity_id`, `entity_type`, `action` (enum), `admin_id` |
| 21 | `customer_tokens` | 🔑 ربط الهاتف بـ tracking token | `phone` (PK), `tracking_token` (UUID gen_random_uuid) |
| 22 | `scheduled_reports` | تقارير مجدولة | `id` (PK), `report_type`, `period` (enum), `recipients` (array), `is_active` |

## 3.2 الـ Enums (7)

```sql
admin_role       → 'developer' | 'manager' | 'order_manager'
offer_status     → 'active' | 'expired' | 'disabled'
order_method     → 'whatsapp' | 'website'
order_status     → 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled'
payment_method   → 'cash' | 'transfer' | 'wallet'
audit_action     → 'modify' | 'cancel' | 'status_change' | 'other'
report_period    → 'daily' | 'weekly' | 'monthly'
```

## 3.3 هيكل الـ Orders بالتفصيل

```sql
orders (
  id                          UUID PK DEFAULT gen_random_uuid()
  order_number                TEXT UK          ← "BAM-YYYYMMDD-XXXX"
  customer_id                 UUID FK→users
  customer_name               TEXT NOT NULL
  customer_phone              TEXT NOT NULL
  tracking_token              TEXT              ← UUID للتتبع
  delivery_address            TEXT NOT NULL     ← إجباري (≥10 أحرف)
  subtotal                    NUMERIC NOT NULL  ← محسوب Server-side
  delivery_fee                NUMERIC DEFAULT 0
  tax_amount                  NUMERIC DEFAULT 0
  total_amount                NUMERIC NOT NULL  ← recalculation Server-side
  notes                       TEXT
  estimated_time              TIMESTAMPTZ
  order_method                order_method NOT NULL
  payment_method              payment_method DEFAULT 'cash'
  offer_id                    UUID FK→offers
  status                      order_status DEFAULT 'pending'
  version                     INTEGER DEFAULT 1  ← Optimistic Locking
  created_at / updated_at     TIMESTAMPTZ
  is_archived / archived_at   BOOLEAN + TIMESTAMPTZ
  is_deleted / deleted_at     BOOLEAN + TIMESTAMPTZ

  -- Delivery Geo Fields
  delivery_latitude           NUMERIC
  delivery_longitude          NUMERIC
  delivery_zone               TEXT              ← null (محلول)
  delivery_distance_km        NUMERIC
  delivery_duration_minutes   INTEGER
  location_verified           BOOLEAN DEFAULT false

  -- Delivery Fee Snapshot Fields (إضافة 0010)
  base_delivery_fee_amount    NUMERIC DEFAULT 0
  extra_distance_km           NUMERIC DEFAULT 0
  extra_fee_amount            NUMERIC DEFAULT 0
  weather_fee_amount          NUMERIC DEFAULT 0
  peak_fee_amount             NUMERIC DEFAULT 0
  peak_percentage_used        NUMERIC DEFAULT 0
)
```

## 3.4 الـ site_settings (Key-Value Store)

الإعدادات المخزنة في جدول `site_settings`:

| Key | Type | Default | الوصف |
|-----|------|---------|-------|
| `restaurant_name` | string | "بيت المندي" | اسم المطعم |
| `restaurant_image` | string | "" | شعار المطعم (URL) |
| `restaurant_lat` | string | "15.360..." | خط عرض المطعم |
| `restaurant_lng` | string | "44.174..." | خط طول المطعم |
| `address_main` | string | "" | عنوان المطعم |
| `currency` | string | "ريال" | العملة |
| `phone_reservations` | string | "" | هاتف الحجوزات |
| `phone_delivery_whatsapp` | string | "" | واتساب التوصيل |
| `whatsapp_order_number` | string | "" | رقم الواتساب |
| `delivery_enabled` | string | "true" | تفعيل التوصيل |
| `base_delivery_fee` | string | "400" | رسوم التوصيل الأساسية |
| `included_distance_km` | string | "2" | المسافة المضمنة |
| `extra_fee_per_km` | string | "100" | رسوم كل كم إضافي |
| `max_delivery_distance_km` | string | "15" | أقصى مسافة توصيل |
| `road_factor` | string | "1.5" | معامل الطريق (Haversine→Road) |
| `enable_weather_fee` | string | "false" | تفعيل رسوم الطقس |
| `weather_fee` | string | "200" | رسوم الطقس |
| `enable_peak_hours` | string | "false" | تفعيل رسوم الذروة |
| `peak_start_time` | string | "12:00" | بداية وقت الذروة |
| `peak_end_time` | string | "14:00" | نهاية وقت الذروة |
| `peak_percentage` | string | "20" | نسبة رسوم الذروة |
| `peak_days` | string | "[]" | أيام الذروة (JSON array) |
| (wallet/bank info) | string | ... | معلومات المحفظة والبنك |

---

# القسم الرابع: الصفحات (Pages)

## 4.1 الصفحات العامة

| المسار | المكون | النوع | الوظيفة |
|--------|--------|-------|---------|
| `/` | `page.tsx` | Client | Landing Page: Hero, Menu Highlights, Stats, Reviews, Gallery, WhatsApp |
| `/menu` | `page.tsx` | Client | عرض المنيو الكامل مع بحث، تصنيفات، إضافة إلى السلة، عرض العروض |
| `/my-orders` | `page.tsx` | Client | 🛒 السلة + الخريطة + حساب التوصيل + إنشاء الطلب |
| `/cart` | `page.tsx` | Client | (قديم) سلة المشتريات القديمة |
| `/gallery` | `page.tsx` | Client | معرض الصور مع Lightbox |
| `/contact` | `page.tsx` | Client | نموذج اتصال + إرسال تقييم + معلومات المطعم |
| `/t/[token]` | `page.tsx` | Client | 🔗 تتبع الطلب بالـ tracking token مع InvoiceModal |
| `/track-order/[orderId]` | `page.tsx` | Client | (قديم) تتبع الطلب بـ UUID |
| `/test-map` | `page.tsx` | Client | اختبار الخريطة و OSRM |

## 4.2 صفحات الإدارة

| المسار | المكون | الوظيفة |
|--------|--------|---------|
| `/admin` | `page.tsx` | Dashboard: إجمالي الطلبات، الإيرادات، العناصر النشطة |
| `/admin/login` | `page.tsx` | تسجيل الدخول (Supabase Auth) |
| `/admin/orders` | `page.tsx` | إدارة الطلبات (تحديث الحالة، عرض التفاصيل) |
| `/admin/menu` | `page.tsx` | CRUD الأطباق (إضافة/تعديل/حذف مع الصور والأسعار) |
| `/admin/categories` | `page.tsx` | CRUD التصنيفات |
| `/admin/offers` | `page.tsx` | CRUD العروض والباقات (4 أنواع تسعير) |
| `/admin/gallery` | `page.tsx` | إدارة معرض الصور |
| `/admin/reviews` | `page.tsx` | إدارة التقييمات (الموافقة/الرفض) |
| `/admin/reports` | `page.tsx` | 📊 التقارير (9 تبويبات مع طباعة وتصدير) |
| `/admin/delivery` | `page.tsx` | 🚚 إعدادات التوصيل (المسافة، الطقس، الذروة، أيام الذروة) |
| `/admin/settings` | `page.tsx` | إعدادات الموقع (المطعم، جهات الاتصال، معلومات البنك) |

---

# القسم الخامس: API Routes

## 5.1 Routes المفتوحة (Public)

| المسار | الطريقة | الوظيفة |
|--------|---------|---------|
| `/api/auth/login` | POST | تسجيل دخول المشرفين (Supabase Auth + Cookie) |
| `/api/resolve-zone` | POST | (قديم) حل المنطقة من الإحداثيات |

## 5.2 Routes التقارير (كلها GET)

| المسار | الوظيفة |
|--------|---------|
| `/api/reports/dashboard` | مبيعات اليوم، عدد الطلبات، آخر 10 طلبات |
| `/api/reports/orders` | سجل الطلبات مع فلترة (status, payment, search) |
| `/api/reports/products` | تحليل المنتجات (top 10, فئات، غير مطلوبة) |
| `/api/reports/customers` | تحليل العملاء (top 50) |
| `/api/reports/compare` | مقارنة الفترات (نمو المبيعات، الطلبات، التوزيع) |
| `/api/reports/offers` | تحليل العروض (إجمالي الخصومات، top 10) |
| `/api/reports/invoices` | قائمة الفواتير |
| `/api/reports/audit` | سجل تدقيق تغيير الحالة |
| `/api/reports/sales` | تحليل مبيعات (Drizzle ORM) |
| `/api/reports/delivery-analytics` | تحليلات التوصيل (الرسوم حسب اليوم/المسافة) |
| `/api/reports/cron` | (محمي) نقاط cron للتقارير المجدولة |
| `/api/reports/schedule` | POST: جدولة تقارير email |

---

# القسم السادس: دورة حياة الطلب

```
┌─────────────────────────────────────────────────────────────────┐
│                     دورة حياة الطلب الكاملة                       │
└─────────────────────────────────────────────────────────────────┘

1. تصفح المنيو
   ├── Client: /menu → عرض الأطباق مع الأسعار
   ├── Client: useCartStore (Zustand, localStorage "bam-cart-storage")
   └── دعم الباقات والعروض الفردية

2. إنشاء الطلب (/my-orders)
   ├── Client: إدخال الاسم، الهاتف، العنوان (إجباري ≥10 أحرف)
   ├── Client: اختيار الموقع على الخريطة (Leaflet)
   ├── Client: calculateDeliveryFeeServer(lat, lng) ← Server Action
   │   ├── التحقق من موقع صنعاء (isInsideSanaa)
   │   ├── حساب مسافة OSRM (calculateRoute)
   │   └── حساب رسوم التوصيل (calculateDeliveryFee)
   ├── Client: إرسال الطلب (createOrder)
   │
   └── Server Action: createOrder()
       ├── 1. التحقق من البيانات (validation)
       ├── 2. جلب إعدادات التوصيل (fetchDeliverySettings)
       ├── 3. التحقق من الموقع (isInsideSanaa + المسافة القصوى)
       ├── 4. حساب المسافة (OSRM → Haversine fallback)
       ├── 5. حساب رسوم التوصيل (calculateDeliveryFee)
       ├── 6. إنشاء رقم الطلب (generateOrderNumber مع Optimistic Locking)
       ├── 7. إدارة tracking token (جلب/إنشاء من customer_tokens)
       ├── 8. التحقق من العرض (إن وجد: offer validation + pricing)
       ├── 9. حفظ الطلب (orders table + order_items)
       ├── 10. حفظ حالة البداية (order_status_history)
       ├── 11. حفظ لقطة العرض (order_offers + order_offer_items)
       └── 12. إرجاع { order, trackingToken }

3. متابعة الطلب
   ├── العميل: /t/[token] → صفحة تتبع مع QR + InvoiceModal
   └── الإدارة: /admin/orders → إدارة الحالة

4. تحديث الحالة (Admin)
   └── updateOrderStatus(orderId, newStatus, adminId?)
       ├── قراءة الحالة الحالية + version
       ├── تحديث بـ Optimistic Locking (.eq('version', currentVersion))
       ├── تسجيل في order_status_history
       └── معالجة تعارض التحديث المتزامن

5. الفاتورة
   ├── Client: InvoiceModal → PNG (html2canvas) / PDF (jsPDF)
   └── Admin: receipt-html.ts → طباعة مباشرة (window.print)

6. الأرشفة
   └── is_archived = true / is_deleted = true (soft delete)
```

---

# القسم السابع: نظام التوصيل

## 7.1 تدفق حساب التوصيل

```
العميل يختار موقعاً على الخريطة
        │
        ▼
calculateDeliveryFeeServer(lat, lng)  ← Server Action
        │
        ├── isInsideSanaa(lat, lng)    ← Ray-casting على حدود صنعاء
        │   └── × خارج صنعاء → خطأ
        │
        ├── fetchDeliverySettings()    ← site_settings (17 مفتاح)
        │   ├── restaurant_lat/lng, delivery_enabled
        │   ├── base_delivery_fee, included_distance_km
        │   ├── extra_fee_per_km, max_delivery_distance_km
        │   ├── road_factor
        │   ├── enable_weather_fee, weather_fee
        │   └── enable_peak_hours, peak_start/end_time, peak_percentage, peak_days
        │
        ├── haversineDistance()        ← المسافة المستقيمة
        │
        ├── calculateRoute()           ← OSRM (8s timeout)
        │   ├── نجاح → التحقق من isRouteValid()
        │   ├── فشل → estimateRoadDistance(straightLine × roadFactor)
        │   └── غير صالح → estimateRoadDistance(straightLine × roadFactor)
        │
        ├── التحقق من maxDistance
        │
        └── calculateDeliveryFee({distanceKm, settings})
            │
            ├── baseFee = baseDeliveryFee (إذا distance ≤ includedKm)
            │   أو baseFee = base + extraKm × extraFeePerKm
            │
            ├── + weatherFee إذا مفعل
            │
            ├── + peakFee (baseFee × peakPercentage%) إذا:
            │   - الوقت الحالي بين peakStart و peakEnd
            │   - اليوم الحالي ضمن peakDays
            │
            └── الإرجاع: {fee, baseFee, weatherFee, peakFee, ...}
```

## 7.2 معادلة التسعير

```
إذا distanceKm ≤ includedDistanceKm:
    deliveryFee = baseDeliveryFee
وإلا:
    deliveryFee = baseDeliveryFee + (distanceKm - includedDistanceKm) × extraFeePerKm

الرسوم الإضافية (إن وجدت):
    + weatherFee (إذا مفعل)
    + baseFee × peakPercentage / 100 (إذا وقت ذروة ويوم ذروة)

القيم الافتراضية:
    baseDeliveryFee = 400 ريال
    includedDistanceKm = 2 كم
    extraFeePerKm = 100 ريال/كم
    maxDeliveryDistanceKm = 15 كم
    weatherFee = 200 ريال
    peakPercentage = 20%
```

## 7.3 تدفق OSRM

```
calculateRoute(originLat, originLng, destLat, destLng, straightLineKm, roadFactor)
    │
    ├── URL: https://router.project-osrm.org/route/v1/driving/{lng},{lat};{lng},{lat}
    │
    ├── Response: distance (متر), duration (ثانية)
    │
    ├── isRouteValid(osrmKm, straightLineKm, roadFactor)
    │   ├── osrmKm < straightLine → false
    │   ├── osrmKm > straightLine × 10 → false
    │   └── osrmKm < straightLine × 0.75 → false
    │
    └── Fallback: straightLineKm × roadFactor (افتراضي 1.5)
```

---

# القسم الثامن: نظام العروض والباقات

## 8.1 أنواع العروض (4 أنواع)

| النوع | الوصف | المثال |
|-------|-------|--------|
| `fixed_price` | سعر ثابت للباقة | "عائلة كاملة بـ 5000" |
| `percentage_discount` | خصم نسبة مئوية | "خصم 20% على الباقة" |
| `amount_discount` | خصم مبلغ ثابت | "خصم 1000 ريال" |
| `free_item` | أرخص منتج مجاني | "اشتري 2 والثالث مجاني" |

## 8.2 محرك التسعير (offer-pricing.ts)

```typescript
calculateOfferPrice({ offerType, salePrice, discountPercent, discountAmount, items })
    │
    ├── originalPrice = Σ(item.unitPrice × item.quantity)
    │
    ├── fixed_price       → finalPrice = salePrice ?? originalPrice
    ├── percentage_discount → finalPrice = originalPrice × (1 - discountPercent/100)
    ├── amount_discount   → finalPrice = max(0, originalPrice - discountAmount)
    └── free_item         → finalPrice = originalPrice - unitPriceCheapestItem
    │
    └── return { originalPrice, discountAmount, discountPercent, finalPrice, savings }
```

## 8.3 اللقطات (Snapshots)

عند إنشاء طلب بعرض:
1. `order_offers`: يخزن `offer_name, original_price, discount_amount, final_price`
2. `order_offer_items`: يخزن تفاصيل مكونات الباقة لكل طلب
3. هذا يضمن دقة التقارير حتى لو تغير العرض لاحقاً

---

# القسم التاسع: نظام الفواتير

## 9.1 مكونان، مصدر واحد

```
receipt-html.ts (Server/Print)
    ├── generateReceiptBody(order, settings, trackUrl, bundleInfo)
    │   └── HTML string → يستخدم في:
    │       ├── admin/reports/InvoicesTab.tsx (طباعة مباشرة)
    │       └── InvoiceModal.tsx (مطابقة التصميم)
    │
    └── generateReceiptHtml(order, settings, trackUrl, bundleInfo)
        └── مستند HTML كامل للطباعة
            └── ينتظر تحميل الصور قبل window.print()

InvoiceModal.tsx (Client/Modal)
    ├── عرض الفاتورة في مودال (React component)
    ├── تصدير PNG → html2canvas (scale: 3)
    └── تصدير PDF → jsPDF
        ├── format: [80mm, proportionalHeight]  ← صفحة واحدة
        └── addImage(imgData, 'PNG', 0, 0, 80mm, height)
```

## 9.2 محتوى الفاتورة

```
┌──────────────────────────────┐
│    ── فاتورة خاصة بالزبون ── │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                              │
│        [شعار المطعم]         │
│        بيت المندي             │
│        العنوان                │
│    هاتف: XXX — واتساب: XXX   │
│  ─────────────────────────── │
│  رقم الفاتورة  │ BAM-XXXX..  │
│  التاريخ       │ 15 يونيو    │
│  الوقت         │ 08:30 م     │
│  وسيلة الدفع   │ نقداً        │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  │ بيانات العميل             │
│  │ الاسم: محمد               │
│  │ الهاتف: 777...            │
│  │ العنوان: ...              │
│  ─────────────────────────── │
│  │ تفاصيل الطلب              │
│  │ صنف   | حجم | ك | س | إج  │
│  │ مندي  | وسط | 2 | 1500|3000│
│  │ ...                      │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  │ [معلومات الباقة إن وجدت]  │
│  ─────────────────────────── │
│  المجموع الفرعي   3000       │
│  رسوم التوصيل      400       │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  الإجمالي النهائي 3400 ﷼    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│       [QR Code للـ tracking] │
│                              │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│     شكراً لثقتكم بنا         │
│        بيت المندي             │
│  © 2026 بيت المندي            │
└──────────────────────────────┘
```

## 9.3 مواصفات PDF

- **العرض**: 80mm (فاتورة حرارية قياسية)
- **الارتفاع**: متناسب مع Canvas (صفحة واحدة فقط)
- **الوحدة**: mm
- **الضغط**: نعم (compress: true)
- **الهامش**: 0 (بدون هوامش بيضاء)
- **مصدر الصورة**: Canvas من html2canvas بـ scale 3

## 9.4 مواصفات الطباعة (Admin)

- **الحجم**: 320px عرض (يتوسط الشاشة)
- **خطوط**: Tajawal (Google Fonts)
- **الألوان**: `#3D0820` (maroon), `#c59b5f` (gold)
- **انتظار الصور**: كود JavaScript ينتظر تحميل جميع الصور قبل `window.print()`
- **@media print**: `page-break-inside: avoid` على جميع الأقسام

## 9.5 نظام Tracking Token

```
إنشاء الطلب
    │
    ├── phone → البحث في customer_tokens
    │   ├── موجود → استخدام token الحالي (ثبات للزبون)
    │   └── غير موجود → إنشاء token جديد (crypto.randomUUID)
    │
    ├── تخزين token في orders.tracking_token
    │
    ├── token ←→ QR Code في الفاتورة
    │
    └── /t/[token] → صفحة تتبع الطلب
        ├── جلب الطلب بـ tracking_token
        ├── عرض الحالة + التفاصيل
        └── InvoiceModal مع QR
```

---

# القسم العاشر: الأمان والصلاحيات

## 10.1 الأدوار (3 أدوار)

| الدور | الوصف | الصلاحيات |
|-------|-------|-----------|
| `developer` | مطور كامل الصلاحيات | كل شيء |
| `manager` | مدير المطعم | Dashboard, Menu, Categories, Offers, Gallery, Reviews, Reports, Settings, Delivery |
| `order_manager` | مدير الطلبات فقط | Orders فقط |

## 10.2 التحكم في الوصول

```
1. Middleware (src/middleware.ts)
   ├── يطابق /admin/:path*
   ├── يستدعي updateSession من utils/supabase/middleware
   └── يتحقق من:
       ├── وجود جلسة Auth
       ├── وجود سجل في admin_users
       └── صلاحية الوصول للصفحة (canAccessPage)

2. Server-Side (permissions.ts)
   ├── PAGE_ACCESS map
   ├── canAccessPage(role, pathname)
   ├── getAllowedSidebarLinks(role)
   └── getDefaultRedirect(role)

3. RLS (Row Level Security)
   └── rls.sql يحتوي على:
       ├── is_admin()        ← التحقق من admin في admin_users
       ├── get_admin_role()  ← جلب دور المشرف
       ├── Public SELECT على: categories, items, item_prices, offers,
       │                      gallery_images, site_settings, branches
       ├── Admin-only INSERT/UPDATE/DELETE
       ├── العملاء يرون طلباتهم فقط (customer_phone)
       └── الـ admins يرون كل الطلبات
```

## 10.3 حماية Server Actions

- `createOrder` → `'use server'` → يتحقق من البيانات فقط (ليس Auth)
- `updateOrderStatus` → `'use server'` → لا يتحقق من Auth مباشرة (مستعملة من Admin)
- `calculateDeliveryFeeServer` → `'use server'` → بدون Auth (خدمة عامة)
- الصلاحية مفعلة على مستوى الـ middleware + الـ sidebar

## 10.4 الثغرات المحتملة

| الثغرة | الحالة | التأثير |
|--------|--------|---------|
| `updateOrderStatus` بدون تحقق من Auth | ⚠️ تعتمد على Middleware | منخفضة - يمكن استدعاؤها من أي Client |
| `createOrder` بدون حماية CSRF | ⚠️ لا يوجد CSRF Token | متوسطة |
| `calculateDeliveryFeeServer` عام | ✅ مقصود | منخفض - مجرد معاينة |
| tracking token قابل للتخمين | ✅ `crypto.randomUUID()` | منخفض |
| `site_settings` عامة للقراءة | ✅ مقصود | منخفض |

---

# القسم الحادي عشر: نظام التقارير

## 11.1 العمارة

```
واجهة التقارير (Client)
    └── /admin/reports/page.tsx
        └── 9 تبويبات
            ├── DashboardTab
            ├── OrdersTab
            ├── ProductsTab
            ├── CustomersTab
            ├── SummaryTab
            ├── OffersTab
            ├── InvoicesTab
            ├── AuditLogsTab
            └── DeliveryAnalyticsTab
                │
                └── API Routes (12 endpoints)
                    ├── REST (Supabase Client)
                    └── Drizzle ORM (server-side)
                        └── services/reports/
                            ├── salesReport.ts
                            ├── analyticsEngine.ts
                            ├── customerReport.ts
                            ├── dashboardReport.ts
                            ├── ordersReport.ts
                            └── productReport.ts
```

## 11.2 الطباعة والتصدير

```
طباعة (printReport.ts)
    ├── fetchData() → جمع البيانات من API
    ├── buildSection() → بناء HTML كامل مع CSS مضمن
    ├── فتح نافذة طباعة (window.open)
    └── wait + window.print()

تصدير Excel (exportExcel.ts)
    └── ExcelJS → .xlsx متعدد الأوراق
        ├── Orders Sheet
        ├── Products Sheet
        ├── Customers Sheet
        ├── Sales Comparison Sheet
        └── Delivery Analytics Sheet
```

---

# القسم الثاني عشر: الـ Stores

## 12.1 cartStore (Zustand + persist)

```typescript
// المفتاح في localStorage: "bam-cart-storage"
// الـ middleware: persist

useCartStore(
    state: {
        items: CartItem[]   // [id, name, price, quantity, size, category, image, offer...]
    },
    actions: {
        addToCart(item)     // يبحث عن duplicate (id + size) → يزيد الكمية
        removeFromCart(id)  // يزيل العنصر
        updateQuantity(id, quantity)  // يغير الكمية (0 → إزالة)
        clearCart()         // يفرغ السلة
        getCartTotal()      // Σ(price × quantity)
        getTotalItems()     // Σ(quantity)
    }
)
```

## 12.2 SettingsContext (React Context)

```typescript
SettingsProvider
    ├── refresh() → fetch site_settings from Supabase
    ├── تحويل البيانات إلى Record<string, string>
    └── توفير { settings, loading, refresh } للـ children

useSettings() → { settings: Record<string, string>, loading: boolean }
```

---

# القسم الثالث عشر: ملفات قديمة (غير مستخدمة)

هذه الملفات كانت جزءاً من النظام القديم (تسعير المناطق) ولم تعد تُستورد من أي كود إنتاجي:

| الملف | السبب |
|-------|-------|
| `src/lib/delivery-zones.ts` | نظام المناطق (Azal, Shattar, إلخ) — تم استبداله بتسعير المسافة |
| `src/lib/geo/resolve-zone.ts` | حل المنطقة بـ Nominatim API — لم يعد مستخدماً |
| `src/lib/geo/resolve-location.ts` | محرك R-Tree spatial indexing — لم يعد مستخدماً |
| `src/lib/geo/sanaa-boundaries.ts` | تحميل GeoJSON — لم يعد مستخدماً |
| `src/app/api/resolve-zone/route.ts` | API حل المنطقة — لم يعد مستخدماً |
| `src/app/cart/page.tsx` | صفحة السلة القديمة — تم استبدالها بـ `/my-orders` |
| `src/app/track-order/[orderId]/page.tsx` | تتبع بـ UUID — تم استبدالها بـ `/t/[token]` |
| `delivery_zone` column in orders | قيمة NULL دائماً |

ملاحظة: جدول `delivery_zones` لا يزال موجوداً في قاعدة البيانات لكنه غير مستخدم في أي كود. تم إضافة `delivery_zone: null` في `createOrder` للحفاظ على التوافق الخلفي.

---

# القسم الرابع عشر: خريطة الاعتماديات (Dependency Map)

```
components/ ← app/ ← layout.tsx ← lib/settings-context.tsx ← lib/supabase.ts
                                              │
actions/orders.ts ────────────────────────────┼── lib/delivery-pricing.ts
    │                                         │── lib/delivery-routing.ts
    │                                         │── lib/location-validation.ts
    │                                         └── lib/offer-pricing.ts
    │
actions/items.ts ─────────────────────────────── lib/offer-pricing.ts
actions/categories.ts
actions/orders-offers.ts ─────────────────────── db/schema.ts (types)

store/cartStore.ts ───────────────────────────── (مستقل، Zustand)

app/admin/ ──────────────────────────────────── middleware.ts
    │                                            utils/supabase/middleware.ts
    │                                            lib/permissions.ts
    │
app/admin/reports/ ──────────────────────────── services/reports/
    │                                            db/index.ts (Drizzle)
    │                                            lib/printReport.ts
    │                                            lib/exportExcel.ts
    │
components/invoice/InvoiceModal.tsx ─────────── lib/bundle-utils.ts
    │                                            actions/orders-offers.ts
    │
components/invoice/receipt-html.ts ──────────── lib/bundle-utils.ts

API Routes (/api/reports/*) ─────────────────── services/reports/
                                                    db/index.ts (Drizzle)
                                                    lib/supabase.ts
```

---

# القسم الخامس عشر: Executive Summary

## 15.1 نقاط القوة

- ✅ **مصدر واحد للحقيقة** لرسوم التوصيل (`calculateDeliveryFee`)
- ✅ **جميع الحسابات Server-Side** (لا يُوثق بـ client أبداً)
- ✅ **نظام Optimistic Locking** للطلبات (يمنع التحديث المتزامن)
- ✅ **Snapshots للعروض والتوصيل** (ضمان دقة التقارير)
- ✅ **دعم 4 أنواع عروض** (fixed, percentage, amount, free)
- ✅ **تتبع بثلاث طرق** (Admin UI, Token Link, QR Code)
- ✅ **فواتير بـ 3 صيغ** (PNG, PDF, طباعة مباشرة)
- ✅ **نظام Reports كامل** (9 تبويبات + طباعة + Excel)
- ✅ **قاعدة بيانات قابلة للتوسع** (Drizzle ORM + SQL Migrations)
- ✅ **دورين (Developer, Manager, Order Manager)**

## 15.2 نقاط الضعف الموصى بتحسينها

| المشكلة | الخطورة | التوصية |
|---------|---------|---------|
| `updateOrderStatus` بدون CSRF/Token | 🟡 متوسطة | إضافة التحقق من الـ session داخل الـ Server Action |
| `createOrder` بدون Auth | 🟡 متوسطة | إضافة Rate Limiting + Validation إضافية |
| `fetchDeliverySettings` يُستدعى مرتين (مرة للمعاينة ومرة للإنشاء) | 🟢 منخفضة | دمج الدالتين أو استعمال Cache |
| الملفات القديمة لم تُحذف | 🟢 منخفضة | حذف الملفات غير المستخدمة (delivery-zones.ts, geo/*, cart/page.tsx) |
| Tracking Token يبقى للزبون للأبد | 🟢 منخفضة | إضافة expiry للـ tokens |
| `services/reports/` يستخدم Drizzle لكن بعض الـ API routes تستخدم Supabase REST | 🟢 منخفضة | توحيد الطريقة (كلها Drizzle أو كلها REST) |
| لا يوجد DB Migration للـ drop `delivery_zones` | 🟢 منخفضة | إضافة migration يحذف الجدول نهائياً |

## 15.3 مخرجات المشروع

| الملف | الغرض |
|-------|-------|
| `BAIT_AL_MANDI_ARCHITECTURE.md` | هذا الملف — التوثيق الكامل للنظام |
| (PDF عربي — قيد الإعداد) | نسخة PDF عربية من التوثيق |
| (PDF English — قيد الإعداد) | English PDF version of the documentation |

---

*تم إعداد هذا التوثيق في 15 يونيو 2026*
*جميع الحقوق محفوظة لمطعم بيت المندي © 2026*
