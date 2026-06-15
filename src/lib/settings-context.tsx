'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface SettingsContextValue {
  settings: Record<string, string>;
  loading: boolean;
  refresh: () => Promise<void>;
  currency: string;
  fmt: (amount: number) => string;
}

const FALLBACK_CURRENCY = 'ريال';

const SettingsContext = createContext<SettingsContextValue>({
  settings: {},
  loading: true,
  refresh: async () => {},
  currency: FALLBACK_CURRENCY,
  fmt: (amount: number) => `${amount.toLocaleString('ar-YE')} ${FALLBACK_CURRENCY}`,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('site_settings').select('*');
      if (data && data.length > 0) {
        const map: Record<string, string> = {};
        data.forEach((item: any) => {
          map[item.setting_key] = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        });
        setSettings(map);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const currency = useMemo(() => settings['currency'] || FALLBACK_CURRENCY, [settings]);

  const fmt = useCallback((amount: number) => {
    return `${amount.toLocaleString('ar-YE')} ${currency}`;
  }, [currency]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh, currency, fmt }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
