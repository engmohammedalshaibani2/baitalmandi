# Migration Review

## Migration Inventory

| # | Name | Tracked in Journal? | Status |
|:-:|------|:---:|--------|
| 0000 | Initial schema | ✅ Yes | Applied |
| 0001 | Add RLS | ✅ Yes | Applied |
| 0002 | Add delivery columns | ❌ No | Applied |
| 0003 | Add order sequences | ❌ No | Applied |
| 0004 | Add customer tokens | ❌ No | Applied |
| 0005 | Add order offers | ❌ No | Applied |
| 0006 | Add offer items | ❌ No | Applied |
| 0007 | Add audit logs | ❌ No | Applied |
| 0008 | Add branches | ❌ No | Applied |
| 0009 | Add gallery | ❌ No | Applied |
| 0010 | Add reviews | ❌ No | Applied |
| 0011 | Add site settings | ❌ No | Applied |
| 0012 | Add enums | ❌ No | Applied |
| 0013 | Add indexes | ❌ No | Applied |
| 0014 | Add materialized views | ❌ No | Applied |
| 0015 | Add scheduled reports | ❌ No | Applied |
| 0016 | Add delivery zones | ❌ No | Applied |
| 0017 | Add report logs | ❌ No | Applied |
| **0018** | **Fix order_sequences RLS** | **New** | **Created** |

## Critical Issue

Only 2/18 migrations are tracked in `_journal.json`. This means:
- `drizzle-kit migrate` cannot run reliably
- Migration history is incomplete
- Cannot roll back to a specific version

## Fix Required

Regenerate `_journal.json` with checksums for all 18 migrations:

```bash
# Option 1: Manual journal update
# Edit supabase/migrations/_journal.json to include entries 0000-0017

# Option 2: Drizzle Kit introspection
npx drizzle-kit introspect-pg --connectionString=$DATABASE_URL
# Then compare with existing schema and regenerate journal
```

## Journal Entry Format

Each migration needs:
```json
{
  "idx": 0,
  "version": "2024-01-01T00:00:00Z",
  "checksum": "...",
  "name": "initial_schema"
}
```

## Recommendations

1. Update `_journal.json` with all 18 migration entries (highest priority)
2. Add `0018_add_order_sequences_rls.sql` to the journal after running it
3. Consider using `supabase migration` for future migrations instead of Drizzle Kit
4. Add migration CI check to ensure `_journal.json` stays in sync
