import { supabase as browserClient } from '@/lib/supabase';

let cachedSettings: Record<string, string> | null = null;
let cachePromise: Promise<Record<string, string>> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

/** Client-side cached settings (singleton with TTL). */
export async function getBrowserSettings(forceRefresh = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedSettings && !forceRefresh && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedSettings;
  }
  if (cachePromise && !forceRefresh) {
    return cachePromise;
  }
  cachePromise = (async () => {
    const { data } = await browserClient.from('site_settings').select('*');
    if (!data) return {};
    const map: Record<string, string> = {};
    data.forEach((item: any) => {
      map[item.setting_key] = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
    });
    cachedSettings = map;
    cacheTimestamp = Date.now();
    cachePromise = null;
    return map;
  })();
  return cachePromise;
}

export function clearSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}
