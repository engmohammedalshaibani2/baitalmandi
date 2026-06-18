# Logging Strategy

## Current State

137 `console.log` calls across 18 files. Mix of:
- Debug logs (delivery calculation, order payload snapshots)
- Error logs (catch blocks, network failures)
- Warning logs (missing config, fallback usage)
- Info logs (order created successfully)

## Issues

1. **Debug logs in production** — Delivery calculation details, order payloads, and item snapshots should not be logged in production
2. **PII exposure** — Customer names and phone numbers logged in debug output
3. **No log levels** — All `console.*` calls treated equally
4. **No structured logging** — Mix of `console.log(obj)`, `console.log('label:', obj)`, and `console.log(JSON.stringify(obj))`

## Recommended Strategy

### Level-Based Logging

```ts
// src/lib/logger.ts
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export const logger = {
  debug: (...args: any[]) => { if (DEBUG) console.log('[DEBUG]', ...args); },
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (context: string, error: unknown, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${context}`, {
      message: error instanceof Error ? error.message : error,
      ...meta,
    });
  },
};
```

### Log Classification

| Level | Usage | Examples |
|-------|-------|----------|
| `debug` | Development only | Delivery calc, offer calc, payloads |
| `info` | Business events | Order created, status changed |
| `warn` | Recoverable issues | Fallback used, retry attempt |
| `error` | Failures | DB error, network error, validation failure |

### PII Protection

```ts
function sanitizeForLogs(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ['phone', 'customer_phone', 'customer_name', 'email', 'address'];
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      sensitive.includes(k) ? [k, '[REDACTED]'] : [k, v]
    ),
  );
}
```

## Implementation Plan

1. Create `src/lib/logger.ts` with the level-based logger
2. Replace all `console.log` with `logger.debug` (kept behind DEBUG flag)
3. Replace all `console.error` with `logger.error` (always logged)
4. Add PII sanitization to error log metadata
5. Remove `console.warn` from production code where possible
