# Monitoring Plan

## Production Monitoring Checklist

### Infrastructure Monitoring

| Metric | Tool | Threshold | Alert |
|--------|------|-----------|-------|
| Uptime | Uptime monitor | < 99.9% | 🔴 Pager |
| Response time (p95) | Vercel Analytics | > 5s | 🟡 Email |
| Error rate (5xx) | Vercel Analytics | > 1% | 🔴 Pager |
| Build time | CI/CD | > 10 min | 🟡 Slack |

### Business Monitoring

| Metric | Purpose | Check Frequency |
|--------|---------|:---:|
| Order creation rate | Detect order flow issues | Real-time |
| Order failure rate | Detect transaction issues | Real-time |
| Delivery fee calculation errors | Detect geo/routing issues | Per order |
| Idempotency hit rate | Detect duplicate submissions | Per order |
| Realtime connection count | Detect channel limit issues | Per minute |
| Sync queue length | Detect offline sync issues | Per hour |

### Database Monitoring

| Metric | Query | Threshold |
|--------|-------|-----------|
| Active connections | `SELECT count(*) FROM pg_stat_activity` | > 50 |
| Slow queries (>1s) | `pg_stat_statements` | > 5/min |
| Replication lag | `SELECT now() - pg_last_xact_replay_timestamp()` | > 10s |
| Index usage | `pg_stat_user_indexes` | Unused indexes |
| Table bloat | `pgstattuple` extension | > 20% dead tuples |

### Alerting Rules

```yaml
alerts:
  - name: OrderCreationHighFailureRate
    condition: rate(order_failures[5m]) > 0.05
    severity: CRITICAL
    action: Rollback last deployment
  
  - name: HighRealtimeChannelUsage
    condition: realtime_channels > 80
    severity: WARNING
    action: Investigate channel leaks
  
  - name: SyncQueueBacklog
    condition: sync_queue_length > 100
    severity: WARNING
    action: Process queue manually
  
  - name: DatabaseConnectionHigh
    condition: pg_connections > 40
    severity: WARNING
    action: Check for unclosed connections
```

## Logging Infrastructure

- **Server logs:** Vercel Logs or equivalent
- **Client errors:** Consider Sentry (was installed but removed — unused)
- **Business events:** Custom `audit_logs` table
- **Performance:** Vercel Analytics / Web Vitals

## Runbook

1. **Order creation fails:** Check `audit_logs` and `order_status_history` for the failed order
2. **Realtime disconnects:** Check Supabase Realtime dashboard for active connections
3. **Background sync fails:** Check IndexedDB sync queue in browser DevTools
4. **Database slow:** Run `EXPLAIN ANALYZE` on the slow query, check missing indexes
