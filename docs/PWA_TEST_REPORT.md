# PWA Test Report

## 1. Scope Tested
- Service Worker registration flow (via `window.addEventListener('load')`).
- Installation Prompt Trigger (Custom React UI).
- Offline Page Compilation.
- Route Exclusions.

## 2. Verification Outcomes
- Next.js successfully compiles the Service Worker Registration Component.
- Next.js successfully compiles the Install Prompt Component without React Hydration issues.
- `public/manifest.json` validates with necessary Android properties (e.g. `standalone`, `theme_color`, `icons`).
- `sw.js` correctly prevents interception for `/admin` and Supabase network requests via hardcoded URL check.

## 3. Manual Testing Required
- The user is recommended to deploy to Vercel and test using **Lighthouse PWA Audit**.
- Verify iPhone installation via Safari "Add to Home Screen".
- Verify Android installation prompt appearance.
