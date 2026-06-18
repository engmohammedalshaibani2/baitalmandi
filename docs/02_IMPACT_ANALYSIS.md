# IMPACT ANALYSIS

**Analysis of proposed changes from Production Readiness Audit (Phase 0 Baseline)**
**Date:** 18 June 2026

---

## Change Categories & Risk Levels

| Risk Level | Count | Description |
|-----------|-------|-------------|
| 🔴 **CRITICAL** | 1 | RLS policy changes — can lock out all access |
| 🟠 **HIGH** | 6 | Schema changes, security headers, auth flow, financial logic |
| 🟡 **MEDIUM** | 8 | Code cleanup, duplicate removal, refactors |
| 🟢 **LOW** | 12 | Lint fixes, console removal, dead file deletion, audit additions |

---

## CRITICAL Impact Items

### C1: Fix `order_sequences` RLS (0 policies with RLS enabled)

| Attribute | Assessment |
|-----------|------------|
| **Current state** | RLS enabled, ZERO policies → all INSERT/UPDATE/SELECT fail |
| **Proposed fix** | Add `INSERT` policy for authenticated users, `SELECT` for admin |
| **Scope affected** | `createOrder` server action, all order creation flows |
| **Downstream impact** | Blocks ALL order creation in production |
| **Rollback complexity** | LOW — drop policy or disable RLS |
| **Test required** | ✅ Verify order creation via browser |
| **Migration required** | ✅ New migration (0018) |

---

## HIGH Impact Items

### H1: Wrap `createOrder` in DB transaction

| Attribute | Assessment |
|-----------|------------|
| **Current state** | 10 independent `db.insert()` calls, no rollback on failure |
| **Proposed fix** | Wrap in `DrizzleTransaction` with rollback |
| **Scope affected** | `src/actions/orders.ts` (~lines 1–450) |
| **Downstream impact** | Prevents partial orders; affects order lifecycle |
| **Breakage risk** | Low — transaction semantics well-understood |
| **Test required** | ✅ Simulate mid-order failure, verify rollback |

### H2: Fix idempotency precedence bug (orders.ts:468)

| Attribute | Assessment |
|------------|------------|
| **Current state** | `findUniqueOrderReference` checked AFTER DB writes |
| **Proposed fix** | Move idempotency check BEFORE any writes |
| **Scope affected** | `src/actions/orders.ts` |
| **Breakage risk** | Medium — logic reordering may miss edge cases |
| **Test required** | ✅ Same `idempotency_key` submitted twice → only one order |

### H3: Add CSP header

| Attribute | Assessment |
|------------|------------|
| **Current state** | No Content-Security-Policy in `next.config.js` |
| **Proposed fix** | Add CSP with `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, etc. |
| **Scope affected** | All pages via Next.js headers |
| **Breakage risk** | High — inline scripts, Google Fonts, Leaflet CDN may be blocked |
| **Mitigation** | Start in Report-Only mode for 1 week |
| **Test required** | ✅ All pages render without console CSP errors |

### H4: Fix Realtime per-order channel scaling

| Attribute | Assessment |
|------------|------------|
| **Current state** | `channel(\`order-${orderId}\`)` — 1 channel per order |
| **Proposed fix** | Single `orders-channel` with Postgres filtering or RLS-based filtering |
| **Scope affected** | `src/realtime/OrderRealtimeProvider.tsx`, possibly server-side changes |
| **Breakage risk** | Medium — all current subscribers need reconnection |
| **Test required** | ✅ 100 concurrent orders on one channel |

### H5: Remove unused `@upstash/redis` and `@sentry/nextjs` packages

| Attribute | Assessment |
|------------|------------|
| **Current state** | 2 packages installed, imported in ZERO files |
| **Proposed fix** | `npm uninstall` |
| **Scope affected** | Build size, node_modules size (~200KB saved) |
| **Breakage risk** | Minimal — no runtime code depends on them |
| **Rollback** | `npm install <package>@<version>` |

### H6: Add `audit_log` entries on order creation

| Attribute | Assessment |
|------------|------------|
| **Current state** | Orders created with no audit trail |
| **Proposed fix** | `INSERT INTO audit_log` inside the order transaction |
| **Scope affected** | `src/actions/orders.ts` |
| **Breakage risk** | Low — additive change, non-blocking |

---

## MEDIUM Impact Items

| ID | Change | Scope | Breakage Risk |
|----|--------|-------|---------------|
| M1 | Remove 137 console.log | 18 files across src/ | Low — additive removal |
| M2 | Fix 184 `:any` types | 54 files | Medium — may need interface extraction |
| M3 | Delete 8 dead source files | src/ | Low — no imports |
| M4 | Fix 7 duplicate indexes | Migration (0018) | Low — redundant indexes |
| M5 | Track 16 untracked migrations | supabase/migrations/_journal.json | Low — metadata only |
| M6 | Sync dual cart system (Zustand ↔ IndexedDB) | src/store/, src/lib/ | Medium — order logic depends on cart |
| M7 | Remove 8 unused images | public/ | Low — no references |
| M8 | Add RLS to 7 unprotected tables | src/db/rls.sql + migration | Medium — may block existing queries |

---

## No-Impact Items (Safe to Apply)

| Item | Rationale |
|------|-----------|
| Lint fixes | Whitespace, formatting only |
| `.npmrc` config | Package manager config |
| `.gitignore` additions | Dev-only |
| README updates | Documentation |
| Comment removal | No runtime effect |
| Unused export removal | Tree-shaken by bundler |
| Migration journal update | Metadata only |

---

## Order of Execution (Recommended)

```
Phase 1: CRITICAL → C1 (RLS fix)
Phase 2: HIGH security → H3 (CSP, report-only)
Phase 3: HIGH financial → H1, H2, H6 (transaction + idempotency + audit)
Phase 4: HIGH architecture → H4 (Realtime scaling)
Phase 5: MEDIUM cleanup → M1–M8
Phase 6: LOW cleanup → Lint, formatting, dead files
Phase 7: Verify → Full E2E test suite
```

---

## Dependency Graph

```
C1 (RLS) ──► H1 (Transaction) ──► H2 (Idempotency) ──► H6 (Audit)
             │
             └──► Order Lifecycle ──► H4 (Realtime)
                                    │
                                    └──► M6 (Cart sync)

H3 (CSP) ──► No dependencies (independent)

M1-M5,M7-M8 ──► No dependencies (can parallelize)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Transaction rollback loses data | Log failed attempts to server-side error log |
| CSP blocks legitimate resources | Use Report-Only mode first; whitelist all known origins |
| RLS policy breaks existing queries | Test on staging DB with production dataset |
| Idempotency reorder misses edge case | Unit test with concurrent duplicate submissions |
| Realtime channel refactor drops messages | Implement message replay from `realtime_messages` table |
