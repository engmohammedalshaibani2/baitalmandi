import { supabase as browserClient } from '@/lib/supabase';
import { z } from 'zod';
import { ItemSchema } from '@/validators/orderSchema';

export type ItemFormData = z.infer<typeof ItemSchema>;

export async function getMenuItems(includeInactive = false) {
  let query = browserClient
    .from('items')
    .select('*, category:categories(name_ar)');
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query.order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getMenuCategories() {
  const { data, error } = await browserClient.from('categories').select('id, name_ar').order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getItemPrices() {
  const { data, error } = await browserClient.from('item_prices').select('*');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getItemSortOrder(id: string) {
  const { data, error } = await browserClient.from('items').select('sort_order, category_id').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createItem(payload: any) {
  const { data, error } = await browserClient.from('items').insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateItem(id: string, payload: any) {
  const { error } = await browserClient.from('items').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteItem(id: string) {
  const { error: e1 } = await browserClient
    .from('offer_items')
    .update({ price_id: null })
    .eq('menu_item_id', id);
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await browserClient.from('item_prices').delete().eq('item_id', id);
  if (e2) throw new Error(e2.message);

  const { error: e3 } = await browserClient.from('items').update({ is_active: false }).eq('id', id);
  if (e3) throw new Error(e3.message);
}

export async function deleteItemPrices(itemId: string) {
  const { error: e0 } = await browserClient
    .from('offer_items')
    .update({ price_id: null })
    .eq('menu_item_id', itemId);
  if (e0) throw new Error(e0.message);

  const { error } = await browserClient.from('item_prices').delete().eq('item_id', itemId);
  if (error) throw new Error(error.message);
}

export async function insertItemPrices(prices: any[]) {
  const { error } = await browserClient.from('item_prices').insert(prices);
  if (error) throw new Error(error.message);
}

export async function getPublicMenuCategories() {
  const { data, error } = await browserClient
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPublicMenuItems() {
  const { data, error } = await browserClient
    .from('items')
    .select('*, categories(name_ar), item_prices(*)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPublicMenuOffers() {
  const now = new Date().toISOString();
  const { data, error } = await browserClient
    .from('offers')
    .select(`
      *,
      offer_items(*, menu_item:menu_item_id(*, item_prices(*)))
    `)
    .eq('status', 'active')
    .eq('is_active', true)
    .is('deleted_at', null)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
