import { supabase } from '@/lib/supabase';

export async function upsertSetting(key: string, value: string) {
  const { error } = await supabase.from('site_settings').upsert(
    { setting_key: key, value },
    { onConflict: 'setting_key' }
  );
  if (error) throw error;
}

export async function upsertBulkSettings(settings: { setting_key: string; value: string }[]) {
  const { error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'setting_key' });
  if (error) throw error;
}

export async function getSettings() {
  const { data } = await supabase.from('site_settings').select('*');
  return data || [];
}

export async function getSettingsByKeys(keys: string[]) {
  const { data } = await supabase
    .from('site_settings')
    .select('setting_key, value')
    .in('setting_key', keys);
  return (data || []) as { setting_key: string; value: string }[];
}

export async function getSetting(key: string) {
  const { data } = await supabase.from('site_settings').select('value').eq('setting_key', key).maybeSingle();
  return data?.value as string | undefined;
}
