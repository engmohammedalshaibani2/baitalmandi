# Error Handling Review

## Current Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| `throw new Error(message)` | Server Actions | `throw new Error('الطلب غير موجود')` |
| `try/catch` with console.error | Async operations | Catch blocks log + rethrow |
| Error return values | API routes | `{ error: message }` responses |
| `maybeSingle()` with null check | DB queries | Check for null after fetch |

## Error Handling by Layer

### Server Actions (`src/actions/`)
- **Pattern:** Throw Arabic error messages → caught by client's `useActionState` or try/catch
- **Issue:** No consistent error formatting, raw Supabase errors sometimes leak
- **Fix:** Create `AppError` class with status codes

### API Routes (`src/app/api/`)
- **Pattern:** Return `NextResponse.json({ error })` with appropriate status
- **Issue:** Some routes return 500 with no error details
- **Fix:** Add consistent error response format

### Client Components
- **Pattern:** `try { await action() } catch (e) { setError(e.message) }`
- **Issue:** Raw error messages shown to users (should be sanitized)
- **Fix:** Add error mapping layer

## Missing Error Boundaries

| Route Segment | Error Boundary | Status |
|---------------|:---:|--------|
| Root layout | ❌ | Should add `error.tsx` |
| Admin pages | ❌ | Should add `error.tsx` |
| Public pages | ❌ | Should add `error.tsx` |
| API routes | ⚠️ | Inline try/catch, no global handler |

## Recommendations

1. Create `src/lib/errors.ts` with typed error classes:
```ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string,
  ) {
    super(message);
  }
}
```

2. Add `error.tsx` files for root and `/admin` segments
3. Add Arabic error messages for all user-facing errors
4. Log English/technical details to console, show Arabic to users
5. Add global error handler in API routes
