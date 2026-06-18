# Console Log Audit

## Summary

- **137 console.log/error/warn calls** across 18 files
- **Must keep:** error logging in catch blocks (console.error with contextual data)
- **Must remove:** debug logs that leak implementation details or PII
- **Optional:** informational logs for development

## Breakdown by File

| File | count | Must Keep | Must Remove |
|------|-------|-----------|-------------|
| `src/actions/orders.ts` | 18 | 4 (error context) | 14 (delivery DEBUG, ORDER_PAYLOAD, snapshots) |
| `src/actions/orders.ts:generateOrderNumber` | 2 | 0 | 2 (fallback warning, error) |
| `src/realtime/OrderRealtimeProvider.tsx` | 0 | — | — (already refactored) |
| `src/lib/sync/backgroundSync.ts` | 4 | 2 (error handling) | 2 (debug) |
| `src/lib/pwa/PwaProvider.tsx` | 1 | 1 (SW registration failure) | 0 |
| `src/lib/supabase.ts` | 1 | 1 (missing env vars) | 0 |
| `src/lib/cache/invalidation.ts` | 1 | 1 (channel setup error) | 0 |
| `src/lib/bundle-utils.ts` | 0 | — | — |
| `src/lib/delivery-pricing.ts` | 0 | — | — |

## Recommendation

Add a `debug` utility that respects `NEXT_PUBLIC_DEBUG` env var:

```ts
export const debug = {
  log: (...args: any[]) => {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(...args);
  },
  error: (...args: any[]) => console.error(...args), // Always log errors
};
```

Replace all `console.log` with `debug.log` and keep `console.error` for errors.
