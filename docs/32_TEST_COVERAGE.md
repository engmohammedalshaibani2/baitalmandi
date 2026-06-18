# Test Coverage Report

## Current State

| Type | Count | Framework |
|------|-------|-----------|
| Unit tests | 1 | Vitest |
| Integration tests | 0 | — |
| E2E tests | 0 | — |

### Existing Test
- `src/__tests__/reports.test.ts` — Tests report service functions
- Uses Vitest (configured in `vitest.config.ts` if exists)

## Critical Paths Without Tests

| Path | Risk | Test Priority |
|------|------|:---:|
| `createOrder` — validation, idempotency, transaction | 🔴 HIGH | 🔴 CRITICAL |
| `updateOrderStatus` — optimistic locking | 🔴 HIGH | 🔴 CRITICAL |
| Delivery fee calculation | 🟡 MED | 🟡 HIGH |
| Offer pricing logic | 🟡 MED | 🟡 HIGH |
| Admin CRUD operations | 🟢 LOW | 🟡 MED |
| Report generation | 🟢 LOW | 🟢 LOW |
| RLS policies | 🔴 HIGH | 🔴 CRITICAL |

## Recommended Test Strategy

### Phase 1: Critical Path Tests (3 days)
```ts
// 1. createOrder tests
test('creates order with valid input')
test('rejects order with empty items')
test('rejects order with invalid phone')
test('rejects order below min amount')
test('returns existing order for duplicate idempotency_key')
test('validates delivery distance exceeds max')
test('calculates correct totals with offers')

// 2. updateOrderStatus tests
test('updates status successfully')
test('rejects concurrent modification')
test('logs status history')

// 3. RLS policy tests
test('anonymous user can insert order_sequences')
test('admin can read all orders')
test('customer can only read own orders')
```

### Phase 2: Integration Tests (2 days)
```ts
// 1. Order lifecycle integration
test('complete order flow: create → confirm → prepare → deliver')
test('order with offers creates correct bundle items')

// 2. Delivery calculation
test('calculates delivery fee correctly with all surcharges')
test('rejects delivery beyond max distance')
```

## Infrastructure

```
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```
