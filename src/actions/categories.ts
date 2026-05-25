'use server';

import { createClient } from '@/utils/supabase/server';

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getAllCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCategory(formData: {
  name_ar: string;
  name_en: string;
  slug: string;
  icon?: string;
  image?: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert(formData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, formData: Partial<{
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  image: string;
  sort_order: number;
  is_active: boolean;
}>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
