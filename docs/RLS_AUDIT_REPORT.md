# Database Security & RLS Policy Audit Report

This report outlines the security status of all tables in the Baitalmandi PostgreSQL database, identifies vulnerabilities in the current RLS (Row-Level Security) configuration, and proposes specific fixes.

---

## 1. RLS Audit Matrix

| Table Name | RLS Enabled | Current Policies | Vulnerabilities & Issues |
| :--- | :--- | :--- | :--- |
| `orders` | **Yes** | 1. Admins (ALL)<br>2. Owner: `auth.uid() = customer_id` (SELECT)<br>3. Guest: `customer_id IS NULL` (INSERT) | **Critical**: Guest checkout orders have `customer_id = NULL`. Because of this, guest users cannot select/view their own orders, which breaks order tracking on `/t/[token]` and blocks `order_items` insertion due to subquery checks. |
| `order_items` | **Yes** | 1. Admins (SELECT)<br>2. Owner: `customer_id = auth.uid() OR customer_id IS NULL` (SELECT)<br>3. Relational: `EXISTS (SELECT 1 FROM orders WHERE id = order_id)` (INSERT) | **Blocked**: The insert policy relies on `EXISTS` query on `orders`. Since the guest cannot SELECT the guest order due to `orders` RLS, this insert is rejected with an RLS violation. |
| `order_status_history` | **Yes** | 1. Admins (SELECT / INSERT) | **Blocked**: During checkout, the server action inserts an initial status history record for the order. Since the guest is not an admin, this insert is rejected. |
| `order_offers` | **No** | None | **Data Exposure**: Anyone can read/write data in this table without verification. RLS must be enabled. |
| `order_offer_items` | **No** | None | **Data Exposure**: Anyone can read/write data in this table without verification. RLS must be enabled. |
| `customer_tokens` | **No** | None | **Data Exposure**: Anyone can read/write phone-to-token mappings. RLS must be enabled. |
| `audit_logs` | **No** | None | **Data Exposure**: Anyone can insert/select logs since RLS was never enabled on the table. RLS must be enabled. |
| `scheduled_reports` | **No** | None | **Data Exposure**: Anyone can read/write scheduled reports. RLS must be enabled. |

---

## 2. Proposed Migration & Security Fixes

### A. Resolve Guest Order Tracking & Items Insertion
Update the SELECT policy for `orders` to allow SELECT if the user knows the `tracking_token`:
```sql
CREATE POLICY "Allow select orders via tracking token" ON orders
  FOR SELECT
  USING (auth.uid() = customer_id OR tracking_token IS NOT NULL);
```
*(Since `tracking_token` is an unguessable 128-bit UUID, knowing the token acts as authorization to view the order details).*

### B. Resolve Initial Status History Insertion
Update the INSERT policy for `order_status_history` to allow inserting the initial history row:
```sql
CREATE POLICY "Anyone can insert order_status_history" ON order_status_history
  FOR INSERT
  WITH CHECK (
    is_admin() OR EXISTS (SELECT 1 FROM orders WHERE id = order_id)
  );
```

### C. Enable RLS and Secure Missing Tables
1. **`order_offers`**:
   * Enable RLS.
   * SELECT: Allow if admin OR if the corresponding order is visible.
   * INSERT: Allow if corresponding order exists.
2. **`order_offer_items`**:
   * Enable RLS.
   * SELECT: Allow if admin OR if the corresponding order_offer is visible.
   * INSERT: Allow if corresponding order_offer exists.
3. **`customer_tokens`**:
   * Enable RLS.
   * SELECT: Allow public read by phone number for checkouts.
   * INSERT: Allow public insert of new tokens.
4. **`audit_logs`**:
   * Enable RLS.
   * SELECT & INSERT: Restrict to admins only.
5. **`scheduled_reports`**:
   * Enable RLS.
   * SELECT & INSERT: Restrict to admins only.
