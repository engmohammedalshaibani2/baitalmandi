# PWA Cache Strategy

## 1. Network Only (Never Cache)
Routes explicitly blocked from Service Worker interception to prevent data staleness and security risks:
- `/admin/*`
- `/api/*`
- `/track-order/*`
- `/t/*`
- `*.supabase.co`
- `/checkout`

## 2. Network First (HTML Navigation)
- Navigation requests rely entirely on the Network to ensure users see the latest prices and content.
- **Offline Fallback:** If the network fails, only the following public routes will be served the `/offline` fallback page:
  - `/`
  - `/menu`
  - `/gallery`
  - `/contact`
- Other dynamic routes (admin, tracking) will fail naturally, letting the browser handle the offline error securely.

## 3. Cache First (Static Assets)
- Images, Fonts, CSS, JS, and Icons.
- If cached, served immediately. If not, fetched from the network and cached in the background (`dynamic-cache-v1`).
