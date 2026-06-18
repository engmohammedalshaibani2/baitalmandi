# Audit Log Report

## Change

Added `audit_logs` INSERT inside the Drizzle transaction in `createOrder`.

## Audit Entry

On successful order creation, the following audit entry is created:

| Column | Value | Description |
|--------|-------|-------------|
| `entity_id` | `order.id` | Order UUID |
| `entity_type` | `'order'` | Entity type discriminator |
| `action` | `'other'` | From `audit_action` enum (modify, cancel, status_change, other) |
| `details` | JSON | `{ orderNumber, action: 'created', method, paymentMethod, itemCount, totalAmount }` |
| `admin_id` | `null` | Customer-created orders have no admin |

## Benefits

1. **Audit trail:** Every order creation is permanently logged
2. **Forensics:** The JSON `details` field captures the full context
3. **Atomic:** The audit insert is part of the Drizzle transaction — if the order fails, no audit entry is written

## Future Enhancements

1. Add audit entries for order status changes (currently only in `order_status_history`)
2. Add admin IP/user-agent to details
3. Add audit for category/menu/offer CRUD operations
