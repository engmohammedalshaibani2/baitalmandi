# Cart Sync Audit — Zustand ↔ IndexedDB

## Current Architecture

### Two independent cart systems

```
Client (Zustand)           Client (IndexedDB)
┌─────────────────┐        ┌─────────────────────┐
│ cartStore.ts     │        │ lib/db/indexeddb.ts │
│                  │        │                     │
│ - items          │  ❌    │ - offlineCart       │
│ - addItem()      │  SYNC  │ - syncQueue         │
│ - removeItem()   │        │ - offlineOrders     │
│ - updateQty()    │        │                     │
│ - clearCart()    │        │ - enqueue()         │
│ - total()        │        │ - getPending()      │
└─────────────────┘        └─────────────────────┘
```

## Issues

1. **No synchronization** between Zustand (in-memory) and IndexedDB (persistent)
2. **Cart loss on page refresh** — Zustand state is lost; IndexedDB cart is stale
3. **Offline cart** is never reconciled with the online cart on reconnection
4. **Dual state sources** create race conditions

## Recommended Fix (Medium Complexity)

### Phase 1: Persist Zustand to localStorage (Quick Win)

```ts
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      // ... existing implementation
    }),
    { name: 'baitalmandi-cart' },
  ),
);
```

### Phase 2: Sync Zustand ↔ IndexedDB

```ts
// On cart mutation → also save to IndexedDB
addItem: (item) => {
  set((state) => ({ items: [...state.items, item] }));
  // Also persist to IndexedDB for PWA offline access
  saveCartToIndexedDB(get().items);
};

// On app boot → load from IndexedDB if Zustand is empty
if (get().items.length === 0) {
  loadCartFromIndexedDB().then((items) => set({ items }));
}
```

### Phase 3: Submit Order → Clear Both

When order is submitted via `createOrder`:
1. Clear Zustand cart
2. Clear IndexedDB offlineCart
3. Enqueue only if offline

## Recommendation

Start with Phase 1 (zustand persist middleware) — 10-minute fix, immediate benefit.
