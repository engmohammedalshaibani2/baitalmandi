# Root Cause Analysis Report — Order Creation Failures

This report details the root causes of the critical errors happening during the order creation and checkout process in the Baitalmandi application.

---

## 1. Error: `invalid input syntax for type numeric: "undefined"` / `"NaN"`

### Mechanism
In `src/actions/orders.ts`, the database insert query converts several financial and distance variables to strings before passing them to the Supabase client:
```typescript
subtotal: String(validatedSubtotal),
delivery_fee: String(deliveryFeeNumeric),
total_amount: String(validatedTotalAmount),
```

If the client does not send these values, or if there is a calculation discrepancy resulting in `NaN` or `undefined`, JavaScript evaluates:
* `String(undefined)` $\rightarrow$ `"undefined"`
* `String(NaN)` $\rightarrow$ `"NaN"`

PostgreSQL receives these literal strings for its `numeric` fields, causing a cast syntax violation.

### Root Cause
1. **Client Trust**: The server trusts the client-side `subtotal` for regular items instead of recalculating it on the server.
2. **Missing Input Handling**: If inputs like `delivery_lat` or `delivery_lng` are missing, some variables default to `undefined` or calculation results return `NaN` (e.g. adding `undefined` to numbers).

---

## 2. Error: `new row violates row-level security policy for table "order_items"`

### Mechanism
The `order_items` table has the following insert policy:
```sql
CREATE POLICY "Anyone can insert order_items" ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id)
  );
```

When an anonymous user inserts items, PostgreSQL evaluates `WITH CHECK` by querying the `orders` table.

### Root Cause
1. RLS is enabled on `orders`.
2. The SELECT policy on `orders` for public users is:
   ```sql
   CREATE POLICY "Customers can view their own orders" ON orders 
     FOR SELECT USING (auth.uid() = customer_id);
   ```
3. For guest checkouts, `customer_id` is set to `NULL` (since the user is not authenticated).
4. Because `customer_id` is `NULL`, `auth.uid() = customer_id` evaluates to `FALSE` (or `NULL`), so the guest cannot view the order they just inserted.
5. The subquery `SELECT 1 FROM orders WHERE id = order_id` returns no rows, making `EXISTS(...)` evaluate to `FALSE`. This triggers the RLS violation.

---

## 3. Error: Rollback Failure & Orphan Orders

### Mechanism
When the `order_items` insert fails, the server action catches the exception and attempts to clean up the newly created order:
```typescript
await supabase.from('orders').delete().eq('id', order.id);
```
However, this delete operation does nothing, leaving the order in the database with no items.

### Root Cause
1. **No DELETE Policy**: There is no RLS policy allowing public/anon users to delete rows in the `orders` table.
2. **Delete Prevention Rule**: The database contains a rule:
   ```sql
   CREATE RULE prevent_orders_delete AS ON DELETE TO orders DO INSTEAD NOTHING;
   ```
   This rule intercepts all delete queries on the `orders` table and forces them to do nothing, preventing rollbacks.
