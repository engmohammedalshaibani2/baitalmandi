# Full Project Audit Report

## 1. Project Structure

### Directories & Architecture
- **`/src/app`**: Next.js 14 App Router containing all pages, layouts, and route handlers.
  - `/admin/*`: Admin dashboard routes.
  - `/api/*`: API routes (Auth, Reports, Cron, Map Zones).
  - `/cart`, `/contact`, `/gallery`, `/menu`, `/my-orders`: Public user pages.
  - `/track-order/[orderId]`, `/t/[token]`: Order tracking pages.
- **`/src/actions`**: Next.js Server Actions (`orders.ts`, `settings.ts`, etc.) handling secure server-side mutations.
- **`/src/components`**: React components categorized by domain (`admin`, `invoice`, `layout`, `ui`).
- **`/src/db`**: Database configuration containing Drizzle ORM schema (`schema.ts`), connection (`index.ts`), and RLS policies (`rls.sql`).
- **`/src/lib`**: Core business logic, pricing engines, delivery routing, and utility functions (`pricing-engine.ts`, `delivery-pricing.ts`, `logger.ts`).
  - `/lib/geo`, `/lib/maps`: Geolocation and routing tools.
- **`/src/repositories`**: Data access layer wrapping database calls (`orderRepository.ts`, `settingsRepository.ts`, etc.).
- **`/src/services`**: Specialized business logic, specifically reporting engines (`analyticsEngine.ts`).
- **`/src/store`**: Client-side state management (Zustand `cartStore.ts`).
- **`/src/utils/supabase`**: Supabase clients for SSR, Middleware, and Client Components.
- **`/src/validators`**: Zod validation schemas (`orderSchema.ts`).
- **`/src/cache`**: Caching utilities (`settingsCache.ts`, `reportsCache.ts`).
- **`/src/realtime`**: Supabase realtime providers (`OrderRealtimeProvider.tsx`).

---

## 2. Dependency Graph

### High-Level Architecture Flow
```text
[Client Layer]         [Server Action Layer]          [Data Access Layer]          [Database Layer]
Page (page.tsx)   ->   Server Action (*.ts)      ->   Repository (*.ts)       ->   Supabase / Drizzle
Client Component  ->   API Route (route.ts)      ->   Service (*.ts)          ->   PostgreSQL
Zustand Store     ->   (Validation via Zod)
```

### Specific Module Dependencies
- **UI Components** depend on `store/cartStore.ts` and `lib/formatUtils.ts`.
- **Server Actions** depend on `validators/*`, `lib/logger.ts`, and `repositories/*`.
- **Repositories** depend on `db/index.ts` (Drizzle) and `utils/supabase/server.ts` (Auth).
- **Pricing Engine** depends on `lib/delivery-pricing.ts`, `lib/offer-pricing.ts`.

---

## 3. Critical Flows

### 1. Order Flow
1. **User Action**: User constructs cart via `cartStore.ts`.
2. **Checkout Validation**: `app/cart/page.tsx` submits data to `validators/orderSchema.ts`.
3. **Server Action**: `actions/orders.ts` (specifically `createOrder`) processes the request.
4. **Pricing Engine**: Validates totals via `lib/pricing-engine.ts`.
5. **Database Transaction**: Atomic insertion using `repositories/orderServerRepository.ts` into Drizzle.
6. **Confirmation**: Order created, real-time notification sent, user redirected to tracking.

### 2. Delivery Flow
1. **Location Input**: User provides coordinates or selects map location.
2. **Zone Resolution**: `lib/geo/resolve-zone.ts` or `lib/maps/getDeliveryRoute.ts` calculates distance/zone.
3. **Pricing Calculation**: `lib/delivery-pricing.ts` calculates delivery fee based on settings/zones.
4. **Final Order Total**: Integrated into `pricing-engine.ts` for final order validation.

### 3. Tracking Flow
1. **Access**: User accesses `/track-order/[orderId]` (authenticated) or `/t/[token]` (guest).
2. **Data Fetching**: Next.js server components load data via `repositories/orderRepository.ts`.
3. **Real-time Updates**: `realtime/OrderRealtimeProvider.tsx` subscribes to Supabase CDC (Change Data Capture) for status updates.

### 4. Admin Flow
1. **Authentication**: `/admin/login` -> `utils/supabase/middleware.ts` guards the `/admin` routes.
2. **Dashboard Render**: `app/admin/page.tsx` -> `services/reports/dashboardReport.ts`.
3. **Order Management**: `components/admin/OrdersTab.tsx` -> `actions/orders.ts` (`updateOrderStatus`) -> `repositories/adminRepository.ts`.
4. **Data Mutability**: Repositories enforce strict typed responses and utilize `lib/logger.ts` for audit trails.
