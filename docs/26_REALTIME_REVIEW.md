# Realtime Review

## Current Setup

### Channels

| Channel Name | Table | Filter | Purpose | Subscribers |
|-------------|-------|--------|---------|-------------|
| `orders-global` | orders | None | Admin dashboard, order tracking | Multiple |
| `orders-token-{token}` | orders | `tracking_token=eq.{token}` | Customer tracking | 1-3 |
| `table-{tableName}` | Varies | Optional | Admin CRUD pages | 1 per admin |

### Provider: `OrderRealtimeProvider.tsx`

Architecture after refactor:
- Single `orders-global` channel for ALL per-order subscriptions
- Client-side filtering dispatches events to correct handlers by orderId
- Per-token channels remain (low volume)
- Per-table channels for admin CRUD pages

## Scaling Analysis

| Scenario | Before | After |
|----------|--------|-------|
| Admin views 100 orders | 100 channels | **1 channel** |
| Customer tracks 1 order | 1 channel | 1 channel (token-based) |
| 100 customers tracking | 100 channels | 100 channels (token-based) |
| Admin CRUD on 5 tables | 5 channels | 5 channels |
| **Total at limit** | **~200 channels** | **~106 channels** |

## Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Per-order channels hit connection limit | 🔴 HIGH | **FIXED** |
| Connection status polling (1s) | 🟢 LOW | Reduced to 5s |
| No reconnection backoff | 🟡 MED | Supabase client handles this |
| No heartbeat monitoring | 🟢 LOW | Supabase handles internally |

## Recommendations

1. Monitor channel count during peak hours
2. Add automatic channel cleanup for disconnected clients
3. Consider using Supabase Realtime's `self` broadcast for admin-to-admin messages
4. Add connection status indicator in the admin dashboard
