# Auth Review

## Authentication

| Aspect | Implementation | Status |
|--------|---------------|--------|
| Auth provider | Supabase SSR | ✅ |
| Session storage | Cookie-based (server-side) | ✅ |
| Login flow | `/admin/login` → supabase.auth.signInWithPassword | ✅ |
| Logout | Session clear + redirect | ✅ |
| Password reset | Not implemented | ❌ |
| MFA | Not implemented | 🟢 LOW priority |

## Authorization

| Role | Capabilities | Assigned By |
|------|-------------|-------------|
| `developer` | Full access, manage admins | Self (first) |
| `manager` | CRUD on content, orders, settings | Developer |
| `order_manager` | Order status updates only | Developer/Manager |

### Middleware (`src/middleware.ts`)

```
Request → /admin/:path*? → Check session → Valid? → Forward
                                           → Invalid? → Redirect /admin/login
```

### Admin Role Verification

Server-side: `is_admin()` SQL function checks `admin_users` table via `auth.uid()`.
Client-side: `getAdminRole()` from `lib/permissions.ts`.

## Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| No password reset flow | 🟡 MED | Add Supabase reset password |
| No session timeout | 🟡 MED | Add JWT expiry check |
| `/api/reports/` routes use CRON_SECRET, not auth | 🟡 MED | Add session validation |
| No login attempt rate limiting | 🟡 MED | Add rate limiting middleware |
| `middleware.ts` matcher only covers `/admin` | 🟢 LOW | Add `/api/reports` if needed |
