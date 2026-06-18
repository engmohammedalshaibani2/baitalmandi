# Deployment Checklist

## Pre-Deployment

- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint` (or `next lint`)
- [ ] All migrations applied to staging DB
- [ ] RLS policies verified on staging DB
- [ ] `order_sequences` has policies (0018 migration applied)
- [ ] Environment variables set in production:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `CRON_SECRET` (optional)
- [ ] CSP is in Report-Only mode (monitor for 1 week)
- [ ] No console.log in production code (or use debug flag)
- [ ] Bundle size checked against baseline

## Migration Steps

```bash
# 1. Backup production database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. Apply new migration
psql $DATABASE_URL -f supabase/migrations/0018_add_order_sequences_rls.sql

# 3. Update _journal.json if needed

# 4. Deploy application code
git push production main
# or: vercel --prod

# 5. Verify deployment
curl -I https://baitalmandi.com/
curl https://baitalmandi.com/api/health

# 6. Test critical flows
# - Create order
# - Track order
# - Admin login
# - Admin order management
```

## Post-Deployment Monitoring

- [ ] Monitor error rates for 1 hour
- [ ] Verify order creation works end-to-end
- [ ] Check Realtime connections are stable
- [ ] Verify CSP reports (check browser console or report endpoint)
- [ ] Check sync queue is empty (no backlog)
- [ ] Verify PWA install prompt works

## Rollback Procedure

See `03_ROLLBACK_PLAN.md` for detailed rollback steps.

Quick rollback:
```bash
# Revert code
git revert HEAD --no-edit
git push production main -f

# Revert database (if needed)
psql $DATABASE_URL -c "DROP POLICY IF EXISTS ... ON order_sequences;"
```
