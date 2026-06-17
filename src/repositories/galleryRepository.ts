import { supabase as browserClient } from '@/lib/supabase';

export async function getGalleryImages() {
  const { data, error } = await browserClient.from('gallery_images').select('*').order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function insertGalleryImage(image: any) {
  const { error } = await browserClient.from('gallery_images').insert([image]);
  if (error) throw new Error(error.message);
}

export async function deleteGalleryImage(id: string) {
  const { error } = await browserClient.from('gallery_images').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateGalleryImage(id: string, updates: any) {
  const { error } = await browserClient.from('gallery_images').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}
