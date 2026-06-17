'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { PwaState, PwaInstallStatus, CacheInvalidationEvent, TenantId } from '@/lib/pwa/types';
import { DEFAULT_CLEANUP_CONFIG } from '@/lib/pwa/types';
import { tryProcessQueue } from '@/lib/sync/backgroundSync';
import { createRealtimeInvalidationListener } from '@/lib/cache/invalidation';
import { syncQueue, offlineCart, offlineOrders } from '@/lib/db/indexeddb';
import { supabase } from '@/lib/supabase';

const TENANT_ID: TenantId = 'baitalmandi';

interface PwaContextValue extends PwaState {
  installApp: () => Promise<void>;
  dismissInstallPrompt: () => void;
  updateApp: () => void;
  checkForUpdates: () => Promise<void>;
  getTenantId: () => TenantId;
  refreshSignal: number;
}

const defaultState: PwaState = {
  installStatus: 'idle',
  isOnline: true,
  isUpdateAvailable: false,
  syncQueueLength: 0,
};

const PwaContext = createContext<PwaContextValue>({
  ...defaultState,
  installApp: async () => {},
  dismissInstallPrompt: () => {},
  updateApp: () => {},
  checkForUpdates: async () => {},
  getTenantId: () => TENANT_ID,
  refreshSignal: 0,
});

export function usePwa() {
  return useContext(PwaContext);
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [installStatus, setInstallStatus] = useState<PwaInstallStatus>('idle');
  const [isOnline, setIsOnline] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [syncQueueLength, setSyncQueueLength] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  /* ── Register Service Worker ── */
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] SW registration failed:', err);
        });

      navigator.serviceWorker.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg?.type === 'CACHE_INVALIDATED') {
          setRefreshSignal((s) => s + 1);
          window.dispatchEvent(
            new CustomEvent<CacheInvalidationEvent>('cache-invalidated', {
              detail: msg.payload,
            }),
          );
        }
      });
    }
  }, []);

  /* ── Online/Offline detection ── */
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      void tryProcessQueue();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* ── BeforeInstallPrompt ── */
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallStatus('installable');
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstallStatus('installed');
      setDeferredPrompt(null);
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /* ── Realtime cache invalidation (consolidated, single channel) ── */
  useEffect(() => {
    const cleanup = createRealtimeInvalidationListener(supabase, (event) => {
      setRefreshSignal((s) => s + 1);
      window.dispatchEvent(
        new CustomEvent<CacheInvalidationEvent>('cache-invalidated', {
          detail: event,
        }),
      );
    });
    return cleanup;
  }, []);

  /* ── Periodic IndexedDB cleanup ── */
  useEffect(() => {
    const runCleanup = async () => {
      const now = Date.now();
      const cfg = DEFAULT_CLEANUP_CONFIG;

      /* Cleanup completed sync items older than 7 days */
      await syncQueue.deleteOlderThan(now - cfg.syncQueueCompletedMaxAgeMs, ['completed']);

      /* Cleanup failed sync items older than 30 days */
      await syncQueue.deleteOlderThan(now - cfg.syncQueueFailedMaxAgeMs, ['failed']);

      /* Cleanup abandoned carts older than 24 hours */
      await offlineCart.deleteAbandonedOlderThan(now - cfg.cartAbandonedMaxAgeMs);

      /* Cleanup cached orders older than 90 days */
      await offlineOrders.deleteOlderThan(now - cfg.ordersMaxAgeMs);

      /* Update queue length */
      const pending = await syncQueue.getPending();
      const stale = await syncQueue.getStaleProcessing();
      setSyncQueueLength(pending.length + stale.length);
    };

    void runCleanup();
    const handle = setInterval(runCleanup, DEFAULT_CLEANUP_CONFIG.cleanupIntervalMs);
    return () => clearInterval(handle);
  }, []);

  /* ── Also refresh queue length on online events ── */
  useEffect(() => {
    const update = async () => {
      const pending = await syncQueue.getPending();
      const stale = await syncQueue.getStaleProcessing();
      setSyncQueueLength(pending.length + stale.length);
    };
    window.addEventListener('online', update);
    return () => window.removeEventListener('online', update);
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setInstallStatus(result.outcome === 'accepted' ? 'installed' : 'idle');
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismissInstallPrompt = useCallback(() => {
    setInstallStatus('idle');
    setDeferredPrompt(null);
  }, []);

  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) await registration.update();
    }
  }, []);

  const getTenantId = useCallback(() => TENANT_ID, []);

  return (
    <PwaContext.Provider
      value={{
        installStatus,
        isOnline,
        isUpdateAvailable,
        syncQueueLength,
        installApp,
        dismissInstallPrompt,
        updateApp,
        checkForUpdates,
        getTenantId,
        refreshSignal,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}
