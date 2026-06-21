# PWA Installation Guide

## 1. Supported Platforms
- **Android:** Chrome, Samsung Internet.
- **Desktop:** Chrome, Edge.
- **iOS:** Safari (Add to Home Screen manually).

## 2. Installation Flow
- The application detects `beforeinstallprompt`.
- A custom UI popup `PWAInstallPrompt` displays at the bottom of the screen.
- User clicks "تثبيت" (Install) -> Native browser prompt triggers.
- Installation completes and the app is added to the home screen/app drawer.

## 3. iOS Workaround
- Apple Meta Tags and Touch Icons have been explicitly added to `layout.tsx`.
- Users on iOS Safari must use the "Share" button > "Add to Home Screen".
