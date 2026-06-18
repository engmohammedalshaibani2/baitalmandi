# ROLLBACK PLAN

**Comprehensive rollback procedures for all proposed changes**
**Date:** 18 June 2026
**Repository:** `C:\Users\MOHAMMED GAMEEL\baitalmandiwibapp`

---

## Rollback Principles

1. **Every mutation is reversible** — no change is made without a revert path
2. **Database changes require migration DOWN** — each new migration must have a corresponding revert
3. **Code changes use `git revert`** — atomic commits per change category
4. **Timeline: 1-hour SLA** for critical rollback, 4-hour SLA for high
5. **Sign-off required:** Lead developer approval before and after rollback

---

## Rollback Commands Reference

```bash
# Code revert (specific commit)
git revert <commit-hash> --no-edit

# Code revert (range)
git revert <oldest>..<latest> --no-edit

# Migration revert (use migrate down file)
psql $DATABASE_URL -f supabase/migrations/<rollback-file>.sql

# OR via Studio (if available)
npx drizzle-kit drop
```

---

## CRITICAL Rollback: C1 — RLS Policy Fix

### Change
Adding INSERT/SELECT policies to `order_sequences` table.

### Rollback Procedure

| Step | Action | Command |
|------|--------|---------|
| 1 | Drop added policies | `DROP POLICY IF EXISTS order_sequences_insert ON order_sequences; DROP POLICY IF EXISTS order_sequences_select ON order_sequences;` |
| 2 | (Optional) Disable RLS | `ALTER TABLE order_sequences DISABLE ROW LEVEL SECURITY;` |
| 3 | Revert migration file | Delete `0018_*_rls_fix.sql` or run down migration |
| 4 | Revert code changes | `git revert <commit-for-rls>` |
| 5 | Verify | Try creating an order → should return to prior behavior |

### Success Criteria
- `SELECT * FROM order_sequences` returns rows (authenticated)
- Order creation either succeeds or fails with same error as before

### Duration
< 30 minutes

---

## HIGH Rollback: H1 — Transaction Wrapping

### Change
Wrapping `createOrder` in a `DrizzleTransaction`.

### Rollback Procedure

| Step | Action | Command |
|------|--------|---------|
| 1 | Revert `src/actions/orders.ts` | `git revert <commit-for-transaction>` |
| 2 | Verify | Orders created without transaction again |

### Success Criteria
- `createOrder` returns an order ID
- Multiple DB inserts happen without rollback protection

### Duration
< 15 minutes

---

## HIGH Rollback: H2 — Idempotency Reorder

### Change
Moving `findUniqueOrderReference` check before DB writes.

### Rollback Procedure

| Step | Action | Command |
|------|--------|---------|
| 1 | Revert `src/actions/orders.ts` | `git revert <commit-for-idempotency>` |
| 2 | Verify | Submit same idempotency_key → duplicate order created (original behavior) |

### Duration
< 15 minutes

---

## HIGH Rollback: H3 — CSP Header

### Change
Adding Content-Security-Policy header in `next.config.js`.

### Rollback Procedure

| Step | Action | Command |
|------|--------|---------|
| 1 | Revert CSP addition | `git revert <commit-for-csp>` |
| 2 | Rebuild | `npm run build` |
| 3 | Redeploy | Restart production server |
| 4 | Verify | All pages load without CSP warnings |

### Duration
< 30 minutes

### Fallback (if CSP Report-Only mode is active)
No rollback needed — simply remove the `Content-Security-Policy-Report-Only` header.

---

## HIGH Rollback: H4 — Realtime Channel Refactor

### Change
Replacing per-order channels with a single filtered channel.

### Rollback Procedure

| Step | Action | Command |
|------|--------|---------|
| 1 | Revert `src/realtime/OrderRealtimeProvider.tsx` | `git revert <commit-for-realtime>` |
| 2 | Clear IndexedDB realtime cache | `await db.clear('realtime_messages')` or browser DevTools |
| 3 | Verify | Existing order subscriptions reconnect with per-order channels |

### Duration
< 30 minutes

---

## HIGH Rollback: H5 — Package Removal

### Change
Uninstalling `@upstash/redis` and `@sentry/nextjs`.

### Rollback Procedure

| Step | Action | Command |
|------|--------|---------|
| 1 | Reinstall packages | `npm install @upstash/redis@<version> @sentry/nextjs@<version>` |
| 2 | Revert config changes (if any) | `git revert <commit-for-package-removal>` |
| 3 | Verify | `require.resolve('@upstash/redis')` resolves |

### Duration
< 10 minutes

---

## HIGH Rollback: H6 — Audit Log Addition

### Change
Adding `audit_log` INSERT inside order transaction.

### Rollback Procedure

| Step | Action | Command |
|------|--------|---------|
| 1 | Revert `src/actions/orders.ts` | `git revert <commit-for-audit>` |
| 2 | Verify | Orders created without audit_log entries |

### Duration
< 10 minutes

---

## MEDIUM Rollbacks (M1–M8)

| ID | Change | Rollback | Duration |
|----|--------|----------|----------|
| M1 | Remove console.log | `git revert` relevant commits | < 10 min |
| M2 | Fix `:any` types | `git revert` type fix commits | < 30 min |
| M3 | Delete dead files | `git checkout HEAD~1 -- <deleted-files>` | < 5 min |
| M4 | Remove duplicate indexes | Create new migration that recreates the dropped indexes | < 20 min |
| M5 | Fix migration journal | `git revert` journal-only commit | < 5 min |
| M6 | Sync cart systems | `git revert` cart sync commits | < 20 min |
| M7 | Remove unused images | `git checkout HEAD~1 -- public/<images>` | < 5 min |
| M8 | Add RLS to tables | `DROP POLICY IF EXISTS ...` for each new policy | < 20 min |

---

## Full System Rollback

If a change causes cascading failures, roll back to the last known good state:

```bash
# 1. Identify last known good commit
git log --oneline -20

# 2. Hard reset (if no unpushed work)
git reset --hard <last-good-commit-hash>

# 3. Revert database to matching migration
# Find the migration hash from the commit
# Run down migrations to that point

# 4. Rebuild and redeploy
npm run build
```

---

## Rollback Testing Checklist

- [ ] All rollback procedures tested in staging before production
- [ ] `Rollback_Plan.md` accessible to on-call engineer
- [ ] Git tags created at each pre-change state: `git tag pre-<change-name>`
- [ ] Database backup taken before each migration: `pg_dump ... > backup_<date>.sql`
- [ ] Monitoring alerts configured to detect rollback necessity

---

## Monitoring Triggers for Rollback

| Metric | Threshold | Action |
|--------|-----------|--------|
| Order failure rate | > 5% of requests | Rollback H1, H2 |
| CSP violation reports | > 100/day | Rollback H3 (or adjust CSP) |
| Realtime connection errors | > 10/minute | Rollback H4 |
| 5xx error rate | > 1% of requests | Rollback last 2 changes |
| p95 response time | > 5 seconds | Rollback recent changes |
| Active order count | Drops by > 50% | Immediate rollback |
