# Realtime Scaling Report

## Problem

`OrderRealtimeProvider.tsx` created ONE Supabase Realtime channel per subscribed order ID:
```ts
subscribeToOrder: (orderId) => {
  ensureChannel(orderId, `order-${orderId}`, { filter: `id=eq.${orderId}` });
}
```

**Scaling issue:** Supabase limits Realtime connections per client (typically 50-100 channels). An admin dashboard with 100+ orders would hit this limit.

## Fix: Single Global Channel with Client-Side Filtering

### Architecture

```
Before:                                     After:
┌─ order-abc ─┐                            ┌─ orders-global ────────┐
│ filter:     │  ← 1 channel per order      │  table: orders         │
│ id=eq.abc   │                             │  no filter             │
└─────────────┘                             │                        │
┌─ order-def ─┐                             │ Client-side dispatch:  │
│ filter:     │  → 100 channels = LIMIT     │  event.new.id →        │
│ id=eq.def   │                             │  per-order listeners   │
└─────────────┘                             │  token-based listeners │
                                            │  * (all) listeners     │
                                            └────────────────────────┘
```

### Implementation

- `subscribeToOrder(orderId, handler)` — Adds listener to a Set keyed by `orderId`. The global `orders-global` channel broadcasts to ALL listeners, but each listener filters client-side by `event.new.id === orderId`.

- `subscribeToToken(token, handler)` — Still uses a filtered channel (`tracking_token=eq.{token}`) since token-based subscriptions are low-volume (typically 1-3 per customer).

- `subscribeToAllOrders(handler)` — Adds listener to the `*` key set on the global channel. Receives ALL order changes.

- `subscribeToTable(tableName, handler, filter?)` — Still creates per-table channels (admin-only, low volume).

### Benefits

- **Single channel** for all per-order subscriptions
- **No connection limit** issues regardless of order count
- **No change** to the public API (`subscribeToOrder` signature unchanged)

### Connection Status

Polling interval reduced from 1000ms to 5000ms to reduce overhead.
