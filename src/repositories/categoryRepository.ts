import { supabase as browserClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

export async function getCategories() {
  const { data, error } = await browserClient.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getCategorySortOrder(id: string) {
  const { data, error } = await browserClient.from('categories').select('sort_order').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createCategory(payload: any) {
  const { error } = await browserClient.from('categories').insert([payload]);
  if (error) throw new Error(error.message);
}

export async function updateCategory(id: string, payload: any) {
  const { error } = await browserClient.from('categories').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string) {
  const { count, error: checkError } = await browserClient
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);
  if (checkError) throw new Error(checkError.message);

  if (count && count > 0) {
    const { error } = await browserClient.from('categories').update({ is_active: false }).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await browserClient.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
