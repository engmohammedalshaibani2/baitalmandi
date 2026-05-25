'use server';

import { createClient } from '@/utils/supabase/server';

export async function getItemsWithPrices(categoryId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name_ar, name_en),
      prices:item_prices(*)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAllItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name_ar, name_en),
      prices:item_prices(*)
    `)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createItem(formData: {
  category_id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  image?: string;
  is_best_seller?: boolean;
  is_available?: boolean;
  is_active?: boolean;
  sort_order?: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('items')
    .insert(formData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: string, formData: Record<string, any>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('items')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  // Delete prices first
  await supabase.from('item_prices').delete().eq('item_id', id);
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

// --- Item Prices ---
export async function createItemPrice(formData: {
  item_id: string;
  size_label_ar: string;
  size_label_en: string;
  serves?: number;
  original_price: string;
  sale_price?: string;
  is_active?: boolean;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('item_prices')
    .insert(formData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItemPrice(id: string, formData: Record<string, any>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('item_prices')
    .update(formData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItemPrice(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('item_prices').delete().eq('id', id);
  if (error) throw error;
}
