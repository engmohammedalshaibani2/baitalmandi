import { supabase as browserClient } from '@/lib/supabase';

export async function getOffers() {
  const { data, error } = await browserClient
    .from('offers')
    .select('*, items(name_ar, item_prices(*)), offer_items(*, menu_item:menu_item_id(*, item_prices(*)))')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAllActiveItems() {
  const { data, error } = await browserClient.from('items').select('*, item_prices(*)').eq('is_active', true);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateOffer(id: string, payload: any) {
  const { error } = await browserClient.from('offers').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteOfferItems(offerId: string) {
  const { error } = await browserClient.from('offer_items').delete().eq('offer_id', offerId);
  if (error) throw new Error(error.message);
}

export async function insertOfferItems(rows: any[]) {
  const { data, error } = await browserClient.from('offer_items').insert(rows).select();
  if (error) throw new Error(error.message);
  return data;
}

export async function createOffer(payload: any) {
  const { data, error } = await browserClient.from('offers').insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteOffer(id: string) {
  const { error } = await browserClient
    .from('offers')
    .update({ is_active: false, status: 'disabled', deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleOfferActive(id: string, isActive: boolean) {
  const update: any = { is_active: isActive, status: isActive ? 'active' : 'disabled' };
  if (isActive) update.deleted_at = null;
  const { error } = await browserClient
    .from('offers')
    .update(update)
    .eq('id', id);
  if (error) throw new Error(error.message);
}
