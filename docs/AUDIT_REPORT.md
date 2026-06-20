# Comprehensive System Audit Report — Baitalmandi Web App

This audit report maps out all order creation flows, pricing systems, RLS policies, and database actions to provide a complete layout of the system before any code modifications.

---

## 1. Order Creation & Placement Paths

### Path A: Shopping Cart Checkout Page
* **File Location**: `src/app/cart/page.tsx`
* **Trigger**: Click on checkout buttons ("✓ تأكيد الطلب" or "طلب عبر واتساب").
* **Process**:
  1. Validates inputs: Customer name, Yemeni phone number, and delivery address.
  2. Compiles `orderItems` and `offers` payloads from the cart store state.
  3. Formulates pricing variables (subtotal, delivery fee, total).
  4. Calls the `createOrder` Server Action (`src/actions/orders.ts`).
  5. Clears the cart on success and redirects the user to `/t/[token]` (order tracking).

### Path B: My Orders Checkout Page
* **File Location**: `src/app/my-orders/page.tsx`
* **Trigger**: Same as the cart page, used when checking out from the My Orders dashboard.
* **Process**:
  1. Compiles the cart items and details.
  2. Resolves delivery fee by calling `calculateDeliveryFeeServer`.
  3. Calls the `createOrder` Server Action.
  4. Redirects to `/t/[token]` for realtime tracking.

---

## 2. Pricing and Offers Engine

### A. Offer & Bundle Calculations
* **File**: `src/lib/offer-pricing.ts`
* **Key Function**: `calculateOfferPrice(input: OfferPricingInput): OfferPricingResult`
* **Logic**: Calculates original prices, applies discounts (percentage, fixed amount, free item), and returns rounded final values.
* **Integrations**: Used on both client and server to validate offer bundles.

### B. Delivery Fee Engine
* **File**: `src/lib/delivery-pricing.ts`
* **Key Function**: `calculateDeliveryFee(input: DeliveryFeeInput): DeliveryFeeResult`
* **Logic**: Evaluates base delivery fees plus incremental per-kilometer charges. Integrates weather fee surcharges and peak hours percentage increases.
* **Integrations**: Recalculated on the server to prevent customer tampering.

### C. Server-Side Recalculations
* **File**: `src/actions/orders.ts` (inside `createOrder`)
* **Calculations**:
  * Recalculates offer pricing for any included bundles.
  * Calculates delivery fee server-side if `delivery_lat` and `delivery_lng` are provided.
  * Evaluates subtotal and total amount.
  * *Vulnerability*: Currently trusts `input.subtotal` from the client if no offers are present.

---

## 3. Supabase Client Usage

### Server Client
* **File**: `src/utils/supabase/server.ts`
* **Helper**: `createClient()`
* **Mechanism**: Uses cookies to initialize a Supabase client on the server side using the `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
* **Usage**: Server Actions (`src/actions/*`), Server Repositories (`src/repositories/*`).

### Client-Side Client
* **File**: `src/lib/supabase.ts`
* **Helper**: `supabase` (Browser Client)
* **Mechanism**: Initialized using `@supabase/ssr` `createBrowserClient`.
* **Usage**: Pages like `/t/[token]/page.tsx` to subscribe to order updates and fetch details dynamically.

---

## 4. Database Interactions (Insert / Select / Update)

### Table: `orders`
* **Insert**: Handled in `createOrder` (`src/actions/orders.ts`).
* **Select**:
  * Admin dashboard queries.
  * Customer tracking page `/t/[token]`.
* **Update**:
  * Status updates in `updateOrderStatus`.

### Table: `order_items`
* **Insert**: Batched in `createOrder` (`src/actions/orders.ts`) after `orders` insert succeeds.
* **Select**: Joined in order retrieval queries (e.g., `items:order_items(*)`).

### Table: `order_status_history`
* **Insert**:
  * During order creation (inserts initial 'pending' history record).
  * During manual/system status changes (updates history logs).

### Table: `order_offers` & `order_offer_items`
* **Insert**: Batched in `createOrder` if the order contains offer/bundle packages.

---

## 5. Security & Row-Level Security (RLS) Status

| Table Name | RLS Enabled | Policies Active |
| :--- | :--- | :--- |
| `orders` | **Yes** | Admins (All), Users (Select/Insert if own, or Insert if guest) |
| `order_items` | **Yes** | Admins (All), Users (Insert if order exists, Select if own order) |
| `order_status_history` | **Yes** | Admins (All) |
| `order_offers` | **No** | None |
| `order_offer_items` | **No** | None |
| `customer_tokens` | **No** | None |
| `audit_logs` | **No** | None |
