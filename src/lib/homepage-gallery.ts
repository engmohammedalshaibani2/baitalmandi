import { supabase } from '@/lib/supabase';

export interface HomepageGalleryImage {
  id: string;
  image_url: string;
  category: string | null;
  caption_ar: string | null;
}

/**
 * Single source of truth for homepage gallery images.
 * Fetches only images marked as show_on_homepage = true.
 */
export async function fetchHomepageGalleryImages(): Promise<HomepageGalleryImage[]> {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('id, image_url, category, caption_ar')
    .eq('is_active', true)
    .eq('show_on_homepage', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[HOMEPAGE_GALLERY_LOADED] Error:', error.message);
    return [];
  }

  const images = data || [];

  console.log('[HOMEPAGE_GALLERY_LOADED]', {
    totalGalleryImages: images.length,
    homepageImagesCount: images.length,
  });

  return images;
}
