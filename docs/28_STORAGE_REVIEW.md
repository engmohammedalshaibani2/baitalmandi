# Storage Review

## Supabase Storage

**Current usage:** Storage is configured in the Supabase project but not actively used for uploads from this app.

### Images Sources

| Source | Type | How Served |
|--------|------|------------|
| `public/` | Local static | Direct file access |
| `images.unsplash.com` | Remote (external) | Remote pattern in `next.config.js` |
| `*.supabase.co` | Remote (Supabase Storage) | Remote pattern in `next.config.js` |

### Gallery Images

Gallery images are stored as URLs in `gallery_images.image_url` column. Currently:
- Demo fallback URLs point to Unsplash
- Production should use Supabase Storage URLs

### Menu Item Images

Item images are stored as URLs in `items.image` column. Currently:
- Likely empty or pointing to placeholder URLs
- Should be migrated to Supabase Storage

## Recommendations

| Task | Priority | Effort |
|------|----------|--------|
| Add image upload UI for admin gallery | 🟡 MED | 1 day |
| Add image upload UI for menu items | 🟡 MED | 1 day |
| Migrate existing images to Supabase Storage | 🟢 LOW | 2 hours |
| Add image optimization pipeline (WebP conversion on upload) | 🟢 LOW | 1 day |
| Add `placeholder="blur"` with `blurDataURL` for all images | 🟢 LOW | 1 hour |
