# Dead Code & Project Cleanup Report

This report catalogs unused files, scripts, and imports identified during static analysis of the codebase, ensuring the workspace remains clean and optimized.

---

## 1. Scratch & Test Files (Not for Production)
The following files are utility/debugging scripts present in the root directory. They are not referenced by the application and should not be deployed to production:
1. `test-db.ts` — A direct script to test database connections and schemas.
2. `test-rls.ts` — A temporary audit script used to query RLS policies.

---

## 2. Unused Files & Assets
* **Leaflet Stylesheet**: `leaflet/dist/leaflet.css` imported in `my-orders/page.tsx` is required, but make sure the dependency is only bundled where maps are used.
* **Database SQL files**: `src/db/rls.sql` is a reference file representing database policies and triggers. It is not part of the active bundle, but serves as essential documentation.

---

## 3. Recommended Actions
1. **Clean up Test Scripts**: Delete `test-rls.ts` once RLS policies are deployed and verified.
2. **Move database reference files**: Keep SQL files like `src/db/rls.sql` in a separate `supabase/` or `db/` folder to separate application logic from database migration logs.
