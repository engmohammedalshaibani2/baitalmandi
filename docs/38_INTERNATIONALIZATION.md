# Internationalization (i18n) Review

## Current State

| Aspect | Status | Details |
|--------|--------|---------|
| Default locale | Arabic (ar-YE) | `layout.tsx` sets `lang="ar"` |
| RTL support | ✅ | Arabic RTL layout |
| English support | ⚠️ Partial | DB has `name_en`, `description_en` fields |
| i18n library | ❌ | No `next-intl`, `react-i18next`, etc. |
| Content direction | ✅ | `dir="rtl"` in layout |
| Number formatting | ⚠️ | Uses `toLocaleString('ar-YE')` in some places |
| Date formatting | ⚠️ | Mix of Arabic and ISO formats |

## Duplicate Content Fields in DB

| Table | Arabic | English | Status |
|-------|--------|---------|--------|
| `categories` | `name_ar` | `name_en` | ✅ Both present |
| `items` | `name_ar`, `description_ar` | `name_en`, `description_en` | ✅ Both present |
| `item_prices` | `size_label_ar` | `size_label_en` | ✅ Both present |
| `offers` | `title_ar`, `description_ar` | `title_en`, `description_en` | ✅ Both present |
| `gallery_images` | `caption_ar` | `caption_en` | ✅ Both present |
| `reviews` | `comment_ar` | `comment_en` | ✅ Both present |
| `branches` | `name_ar` | `name_en` | ✅ Both present |

## Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| No locale selection UI | 🟢 LOW | Add language switcher |
| No i18n library | 🟢 LOW | Consider `next-intl` for future multi-language |
| Hardcoded Arabic in code | 🟢 LOW | Acceptable for single-language restaurant |
| Code mix of `name_ar` and `name_en` references | 🟢 LOW | Depends on context (admin uses English, public uses Arabic) |

## Recommendation

For a single-language (Arabic) restaurant app, the current approach is acceptable. If English support is needed:
1. Add `next-intl` for translations
2. Create `/en/` routes for English version
3. Use locale-based field selection in queries
