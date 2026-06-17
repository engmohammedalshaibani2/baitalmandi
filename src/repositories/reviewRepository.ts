import { supabase as browserClient } from '@/lib/supabase';

export async function getReviews() {
  const { data, error } = await browserClient.from('reviews').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createReview(review: any) {
  const { error } = await browserClient.from('reviews').insert([review]);
  if (error) throw new Error(error.message);
}

export async function toggleReviewFeatured(id: string) {
  const { error } = await browserClient.from('reviews').update({ is_featured: true }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteReview(id: string) {
  const { error } = await browserClient.from('reviews').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getFeaturedReviews(limit = 6) {
  const { data, error } = await browserClient
    .from('reviews')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}
