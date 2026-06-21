# توثيق البنية المعمارية — مشروع بيت المندي

## 1. نظرة عامة على المعمارية

يعتمد المشروع على معمارية **Full-Stack Serverless** باستخدام Next.js 14 مع App Router، مما يجمع بين:
- **Server-Side Rendering (SSR)** لتحسين الأداء وتحسين محركات البحث
- **Server Actions** لمعالجة العمليات من جانب الخادم بأمان
- **Supabase** كـ Backend-as-a-Service يوفر قاعدة بيانات وتوثيقاً ومزامنة لحظية

---

## 2. مخطط المعمارية العالي المستوى (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Browser    │  │  Mobile PWA  │  │   Admin Dashboard    │  │
│  │  (Customer)  │  │  (Customer)  │  │   (Staff/Manager)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼────────────────────┼───────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 14 APP ROUTER                         │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │   Page Components │    │       Middleware Layer            │   │
│  │  (RSC + Client)  │    │  (Session Refresh + Auth Guard)  │   │
│  └────────┬─────────┘    └──────────────────────────────────┘   │
│           │                                                       │
│  ┌────────▼─────────┐    ┌──────────────────────────────────┐   │
│  │  Server Actions  │    │         API Routes                │   │
│  │  (orders.ts,     │    │  (/api/reports/*, /api/auth/*)    │   │
│  │   items.ts, etc) │    │                                   │   │
│  └────────┬─────────┘    └─────────────┬────────────────────┘   │
└───────────┼──────────────────────────────┼──────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Repositories│  │   Services   │  │    Lib Utilities     │  │
│  │  (CRUD Ops)  │  │  (Business   │  │  (pricing-engine,    │  │
│  │              │  │   Logic)     │  │   delivery-pricing,  │  │
│  │              │  │              │  │   offer-pricing)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼────────────────────┼───────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE PLATFORM                           │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ PostgreSQL │  │  Auth Module │  │   Realtime Engine      │  │
│  │  Database  │  │  (JWT/RLS)   │  │  (Order Status Updates)│  │
│  │ (19 Tables)│  │              │  │                        │  │
│  └────────────┘  └──────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────┐
│               EXTERNAL SERVICES                                   │
│  ┌────────────────┐   ┌────────────────┐   ┌──────────────────┐ │
│  │  OSRM Routing  │   │  Vercel Deploy │   │  Nodemailer      │ │
│  │  (project-osrm │   │  (Production)  │   │  (Email Reports) │ │
│  │   .org)        │   │                │   │                  │ │
│  └────────────────┘   └────────────────┘   └──────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. هيكلية المشروع الكاملة

```
baitalmandiwibapp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (RTL، SEO، Providers)
│   │   ├── page.tsx                  # الصفحة الرئيسية (SSR)
│   │   ├── HomeClient.tsx            # مكون الصفحة الرئيسية التفاعلي
│   │   ├── globals.css               # نظام التصميم الكامل (27KB)
│   │   ├── error.tsx                 # معالجة الأخطاء
│   │   ├── loading.tsx               # شاشة التحميل
│   │   ├── robots.ts                 # SEO: ملف robots
│   │   ├── sitemap.ts                # SEO: خريطة الموقع
│   │   ├── menu/                     # صفحة القائمة
│   │   ├── cart/                     # صفحة السلة والطلب
│   │   ├── gallery/                  # معرض الصور
│   │   ├── contact/                  # صفحة التواصل
│   │   ├── my-orders/                # طلباتي (بحث برقم الهاتف)
│   │   ├── track-order/[orderId]/    # تتبع طلب محدد
│   │   ├── t/[token]/                # تتبع برمز التتبع
│   │   ├── admin/                    # لوحة الإدارة
│   │   │   ├── layout.tsx            # Admin Layout (SSR auth check)
│   │   │   ├── AdminLayoutClient.tsx # واجهة Sidebar التفاعلية
│   │   │   ├── page.tsx              # داشبورد الرئيسية
│   │   │   ├── login/                # صفحة تسجيل الدخول
│   │   │   ├── orders/               # إدارة الطلبات
│   │   │   ├── menu/                 # إدارة الأطباق
│   │   │   ├── categories/           # إدارة التصنيفات
│   │   │   ├── offers/               # إدارة العروض
│   │   │   ├── gallery/              # إدارة الصور
│   │   │   ├── reviews/              # إدارة التقييمات
│   │   │   ├── delivery/             # إعدادات التوصيل
│   │   │   ├── reports/              # التقارير والتحليلات
│   │   │   └── settings/             # إعدادات النظام
│   │   └── api/                      # API Routes
│   │       ├── auth/                 # مصادقة (logout)
│   │       └── reports/              # تقارير متعددة
│   │           ├── dashboard/
│   │           ├── sales/
│   │           ├── orders/
│   │           ├── products/
│   │           ├── customers/
│   │           ├── offers/
│   │           ├── delivery-analytics/
│   │           ├── compare/
│   │           ├── audit/
│   │           ├── invoices/
│   │           ├── schedule/
│   │           ├── cron/
│   │           └── refresh-mv/
│   │
│   ├── actions/                      # Server Actions
│   │   ├── orders.ts                 # إنشاء وإدارة الطلبات
│   │   ├── items.ts                  # إدارة الأصناف
│   │   ├── categories.ts             # إدارة التصنيفات
│   │   ├── orders-offers.ts          # عمليات الطلبات والعروض
│   │   └── settings.ts               # إعدادات النظام
│   │
│   ├── db/                           # Database Layer
│   │   ├── schema.ts                 # Drizzle ORM Schema (19 Tables)
│   │   ├── index.ts                  # اتصال قاعدة البيانات
│   │   └── rls.sql                   # سياسات Row Level Security
│   │
│   ├── repositories/                 # Data Access Layer
│   │   ├── adminRepository.ts        # عمليات مستخدمي الإدارة
│   │   ├── categoryRepository.ts     # عمليات التصنيفات
│   │   ├── galleryRepository.ts      # عمليات الصور
│   │   ├── menuRepository.ts         # عمليات القائمة
│   │   ├── offerRepository.ts        # عمليات العروض
│   │   ├── orderRepository.ts        # عمليات الطلبات
│   │   ├── reviewRepository.ts       # عمليات التقييمات
│   │   └── settingsRepository.ts     # عمليات الإعدادات
│   │
│   ├── lib/                          # Utility Libraries
│   │   ├── pricing-engine.ts         # محرك الأسعار المركزي
│   │   ├── delivery-pricing.ts       # حساب رسوم التوصيل
│   │   ├── delivery-routing.ts       # توجيه OSRM
│   │   ├── offer-pricing.ts          # حساب أسعار العروض
│   │   ├── location-validation.ts    # التحقق من الموقع (Haversine)
│   │   ├── permissions.ts            # نظام الصلاحيات
│   │   ├── validation.ts             # التحقق من المدخلات
│   │   ├── logger.ts                 # نظام السجلات
│   │   ├── whatsapp-message.ts       # بناء رسائل واتساب
│   │   ├── exportExcel.ts            # تصدير Excel (16KB)
│   │   ├── printReport.ts            # طباعة التقارير (26KB)
│   │   ├── formatUtils.ts            # أدوات التنسيق
│   │   └── settings-context.tsx      # سياق الإعدادات
│   │
│   ├── components/                   # مكونات React
│   │   ├── layout/                   # Navbar, Footer, LoadingScreen
│   │   ├── ui/                       # Toast, مكونات UI
│   │   ├── admin/reports/            # مكونات تقارير الإدارة
│   │   └── invoice/                  # مكونات الفواتير
│   │
│   ├── context/                      # React Contexts
│   ├── store/                        # Zustand State Management
│   ├── realtime/                     # Supabase Realtime
│   ├── schemas/                      # Zod Validation Schemas
│   ├── services/                     # Business Services
│   ├── utils/                        # Supabase Client Utils
│   ├── validators/                   # Input Validators
│   └── middleware.ts                 # Auth Middleware
│
├── public/                           # Static Assets
│   ├── logo.jpg
│   └── Esnaad Tech Logo.svg
│
├── supabase/                         # Supabase Config
├── drizzle.config.ts                 # Drizzle Configuration
├── next.config.js                    # Next.js Configuration
├── tailwind.config.js                # Tailwind Configuration
└── package.json                      # Dependencies
```

---

## 4. طبقات المعمارية (Layered Architecture)

### الطبقة 1: طبقة العرض (Presentation Layer)
- **React Server Components (RSC):** تُنفَّذ على الخادم، مُحسَّنة للأداء
- **Client Components:** تعمل في المتصفح، تتعامل مع التفاعل
- **App Router:** نظام التوجيه المبني على ملفات Next.js 14

### الطبقة 2: طبقة المنطق التجاري (Business Logic Layer)
- **Server Actions:** دوال خادم تُستدعى مباشرة من المكونات
- **API Routes:** نقاط نهاية HTTP للتقارير والمصادقة
- **Lib Utilities:** مكتبات الحساب (pricing، routing، validation)

### الطبقة 3: طبقة الوصول للبيانات (Data Access Layer)
- **Repositories:** تجريد عمليات قاعدة البيانات
- **Drizzle ORM:** تحويل TypeScript إلى SQL بأمان
- **Supabase Client:** اتصال PostgreSQL المُدار

### الطبقة 4: طبقة قاعدة البيانات (Database Layer)
- **PostgreSQL:** قاعدة البيانات الرئيسية
- **RLS Policies:** أمان على مستوى الصف
- **Supabase Auth:** إدارة المصادقة والجلسات

---

## 5. نمط إدارة الحالة (State Management)

| النمط | الأداة | الاستخدام |
|-------|--------|----------|
| Server State | React Server Components | بيانات قاعدة البيانات |
| Global Client State | Zustand | سلة المشتريات، حالة المستخدم |
| UI State | React useState | حالات المكونات المحلية |
| Settings State | React Context | إعدادات الموقع العامة |
| Realtime State | Supabase Realtime | تحديثات حالة الطلبات |

---

## 6. تدفق البيانات

```
User Action
    │
    ▼
Client Component (useState / Zustand)
    │
    ▼
Server Action / API Route (HTTP)
    │
    ├──► Validation Layer (Zod + Custom)
    │
    ├──► Business Logic (lib/pricing, lib/delivery)
    │
    ├──► Repository Layer (Drizzle ORM)
    │
    └──► Supabase PostgreSQL (with RLS)
             │
             ▼
        Response → Client Update
```

---

## 7. مخطط المكونات (Component Diagram)

```
Pages
  ├── HomeClient.tsx
  │     ├── HeroSection
  │     ├── FeaturedItems
  │     ├── OffersSection
  │     └── ReviewsSection
  │
  ├── MenuClient.tsx
  │     ├── CategoryFilter
  │     ├── ItemGrid
  │     └── ItemCard → CartLogic
  │
  ├── CartPage
  │     ├── CartItemsList
  │     ├── DeliverySection → Map
  │     ├── PricingSummary
  │     └── CheckoutForm → createOrder()
  │
  └── AdminLayoutClient.tsx
        ├── Sidebar (role-based links)
        ├── OrdersClientPage
        ├── ReportsClientPage
        └── SettingsClientPage
```

---

## 8. التقنيات المستخدمة

| التقنية | الإصدار | الغرض |
|---------|---------|-------|
| Next.js | 14.2.3 | إطار العمل الأساسي |
| React | 18.3.1 | بناء واجهة المستخدم |
| TypeScript | 5.4.5 | الكتابة الصارمة |
| Supabase JS | 2.106.1 | Client SDK |
| Supabase SSR | 0.3.0 | Server-Side Auth |
| Drizzle ORM | 0.30.10 | ORM لقاعدة البيانات |
| Tailwind CSS | 3.4.3 | نظام التنسيق |
| Framer Motion | 11.2.6 | الرسوم المتحركة |
| Leaflet | 1.9.4 | خريطة التوصيل |
| Recharts | 3.8.1 | رسوم التقارير |
| Zustand | 4.5.2 | إدارة الحالة |
| Zod | 4.4.3 | التحقق من البيانات |
| ExcelJS | 4.4.0 | تصدير Excel |
| jsPDF | 4.2.1 | تصدير PDF |
| Nodemailer | 8.0.10 | إرسال التقارير |
| Turf.js | 7.3.5 | حسابات جغرافية |
| OSRM | External | حساب مسارات التوصيل |
