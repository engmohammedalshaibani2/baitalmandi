# Accessibility Audit

## Current State

| WCAG Criteria | Status | Notes |
|--------------|--------|-------|
| Language attribute | ✅ | `<html lang="ar">` |
| RTL support | ✅ | `dir="rtl"` |
| Keyboard navigation | ⚠️ Partial | Admin pages need improvement |
| Focus management | ⚠️ Partial | Modal/lightbox focus trapping |
| ARIA labels | ❌ | Missing on most interactive elements |
| Alt text on images | ⚠️ Partial | `<Image>` components missing `alt` text |
| Color contrast | ⚠️ | Dark theme with gold accent — needs verification |
| Form labels | ⚠️ | Some forms use placeholders instead of labels |
| Error announcements | ❌ | Form errors not announced to screen readers |
| Skip navigation | ❌ | No skip-to-content link |

## Issues Found

| Issue | File | Fix |
|-------|------|-----|
| Missing `alt` attributes on `<Image>` | `Navbar.tsx`, `Footer.tsx`, `LoadingScreen.tsx` | Add descriptive alt text in Arabic |
| No `aria-label` on navigation | `Navbar.tsx` | Add `aria-label="القائمة الرئيسية"` |
| No `aria-label` on cart button | `Navbar.tsx` | Add `aria-label="عربة التسوق"` |
| Form placeholders instead of labels | `cart/page.tsx` | Add `<label>` elements |
| No focus trapping in lightbox | `gallery/page.tsx` | Implement focus trap |
| No skip link | Root layout | Add skip-to-content link |
| Color contrast unknown | All pages | Test with WCAG contrast checker |

## Quick Wins

1. Add `alt` text to all `<Image>` components (5 min)
2. Add `aria-label` to navigation links (10 min)
3. Add skip-to-content link in layout (5 min)
4. Add `role="alert"` to error messages (10 min)

## Testing

- Use Chrome Lighthouse for automated accessibility audit
- Test with screen reader (NVDA or VoiceOver)
- Test keyboard navigation (Tab, Enter, Escape)
