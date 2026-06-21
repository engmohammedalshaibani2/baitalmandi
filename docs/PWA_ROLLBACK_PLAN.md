# PWA Rollback Plan

## Immediate Rollback Steps
If the PWA implementation causes any production bugs, follow these steps strictly:

1. **Remove Client Components:**
   Delete `<PWAServiceWorkerRegister />` and `<PWAInstallPrompt />` from `src/app/layout.tsx`.
2. **Remove Manifest Reference:**
   Remove `manifest: '/manifest.json'` from `export const metadata` in `src/app/layout.tsx`.
3. **Kill Service Worker:**
   Replace the content of `public/sw.js` with the following kill-switch script, then commit and deploy:
   ```javascript
   self.addEventListener('install', () => self.skipWaiting());
   self.addEventListener('activate', (e) => {
     e.waitUntil(
       caches.keys().then((cacheNames) => {
         return Promise.all(cacheNames.map((name) => caches.delete(name)));
       }).then(() => {
         self.registration.unregister();
       })
     );
   });
   ```
4. **Remove Files:**
   Safely delete `public/manifest.json` and `src/app/offline/page.tsx` after the cache is cleared.
