# PWA Architecture

## 1. Core Principles
- **Vanilla Implementation:** No Next.js PWA plugins were used (e.g., `next-pwa`) to ensure 100% control over the caching layer and zero conflicts with Server Actions.
- **Client Components:** PWA installation (`PWAInstallPrompt.tsx`) and SW registration (`PWAServiceWorkerRegister.tsx`) are isolated in specific Client Components to preserve SSR in layout.tsx.

## 2. Push Notifications Skeleton
- Event listeners for `push` and `notificationclick` have been established in `sw.js`.
- Logic is strictly structured but fully commented out (Skeleton architecture only).
- No new API routes, no VAPID keys, and no Database migrations were created. Activation will require backend support in a future phase.
