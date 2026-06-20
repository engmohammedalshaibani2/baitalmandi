# Transaction Rollback & Orphan Order Prevention Analysis

This document analyzes the rollback mechanism during order creation, the cause of orphan orders, and details the architectural solutions.

---

## 1. The Rollback Mechanism Failure

In `src/actions/orders.ts`, the server action handles item insertion failure by attempting to delete the parent order row manually:
```typescript
if (itemsError) {
  // Attempt rollback
  await supabase.from('orders').delete().eq('id', order.id);
  throw new Error(`فشل إضافة أصناف الطلب: ${itemsError.message}`);
}
```

This rollback is failing, resulting in "orphan orders" (orders with no items, no history, and no offers) persisting in the database.

### Core Causes

#### A. RLS Deletion Block
The database lacks any RLS policy allowing public/anon users to execute `DELETE` statements on the `orders` table. Hence, the `.delete()` request is rejected at the RLS level.

#### B. The Delete Prevention Rule
Even if RLS is bypassed or a policy is added, the database enforces a custom rule:
```sql
CREATE RULE prevent_orders_delete AS ON DELETE TO orders DO INSTEAD NOTHING;
```
This rule intercepts **every** SQL `DELETE` query on `orders` (across all database roles, including admins and superusers) and replaces it with `NOTHING`. As a result, no order row can ever be deleted.

---

## 2. Proposed Architectural Solution: Atomic Database Transactions

Instead of performing manual rollbacks via `DELETE` statements (which violates auditability and is blocked by database rules), we will use **Atomic Database Transactions**.

### Why Transactions?
* **Atomicity (All-or-Nothing)**: All inserts (order, order items, status history, order offers, bundle items) are treated as a single unit of work.
* **No Manual Rollback Required**: If any insertion fails, the database automatically rolls back the entire transaction. No orphan order is ever committed, and no manual `DELETE` query is needed.
* **Bypasses Delete Prevention Rule**: Since the transaction is rolled back before it is committed, the rule is never triggered, yet database integrity is perfectly preserved.

### Drizzle ORM Transaction Implementation
Drizzle ORM connects to PostgreSQL directly as the database owner. We can use Drizzle's `.transaction()` API to execute all queries in a single transaction:

```typescript
await db.transaction(async (tx) => {
  // 1. Insert parent order
  const [order] = await tx.insert(orders).values({ ... }).returning();

  // 2. Insert order items
  await tx.insert(orderItems).values(
    items.map(item => ({ orderId: order.id, ... }))
  );

  // 3. Insert status history
  await tx.insert(orderStatusHistory).values({
    orderId: order.id,
    newStatus: 'pending',
  });

  // 4. Insert offers and bundle items if present
  for (const offer of offers) {
    const [orderOffer] = await tx.insert(orderOffers).values({ ... }).returning();
    await tx.insert(orderOfferItems).values(
      offer.bundleItems.map(bi => ({ orderOfferId: orderOffer.id, ... }))
    );
  }
});
```

Using Drizzle transactions guarantees 100% atomic operations and completely prevents orphan orders.
