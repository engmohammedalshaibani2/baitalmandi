'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { getBrowserSettings, clearSettingsCache } from '@/cache/settingsCache';
import { useOrderRealtime } from '@/realtime/OrderRealtimeProvider';

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
  const { subscribeToTable } = useOrderRealtime();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBrowserSettings(true);
      setSettings(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getBrowserSettings().then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsub = subscribeToTable('site_settings', () => {
      clearSettingsCache();
      getBrowserSettings(true).then(setSettings).catch(() => {});
    });
    return unsub;
  }, [subscribeToTable]);

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
