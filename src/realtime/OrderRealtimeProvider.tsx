'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type OrderChangePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
};

type OrderChangeHandler = (payload: OrderChangePayload) => void;

interface OrderRealtimeContextValue {
  /** Subscribe to changes for a specific order (server-side filter: id=eq.{orderId}). */
  subscribeToOrder: (orderId: string, handler: OrderChangeHandler) => () => void;
  /** Subscribe to changes for orders matching a token (server-side filter: tracking_token=eq.{token}). */
  subscribeToToken: (token: string, handler: OrderChangeHandler) => () => void;
  /** Subscribe to ALL order changes (admin pages — no filter). */
  subscribeToAllOrders: (handler: OrderChangeHandler) => () => void;
  /** Subscribe to changes on any table (admin CRUD pages). */
  subscribeToTable: (tableName: string, handler: OrderChangeHandler, filter?: string) => () => void;
  isConnected: boolean;
}

const OrderRealtimeContext = createContext<OrderRealtimeContextValue>({
  subscribeToOrder: () => () => {},
  subscribeToToken: () => () => {},
  subscribeToAllOrders: () => () => {},
  subscribeToTable: () => () => {},
  isConnected: false,
});

export function useOrderRealtime() {
  return useContext(OrderRealtimeContext);
}

type RealtimeFilter = { event: string; schema: string; table: string; filter?: string };

function createManagedChannel(key: string, channelName: string, rf: RealtimeFilter, handlersRef: React.MutableRefObject<Map<string, Set<OrderChangeHandler>>>) {
  if (typeof window === 'undefined') return null;
  const ch = supabase
    .channel(channelName);
  (ch as any)
    .on('postgres_changes', rf, (payload: any) => {
      const changePayload: OrderChangePayload = {
        eventType: payload.eventType,
        new: payload.new || {},
        old: payload.old || {},
      };
      const handlers = handlersRef.current.get(key);
      if (handlers) handlers.forEach((h) => h(changePayload));
    })
    .subscribe();
  return ch;
}

export function OrderRealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = React.useState(false);
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const listenersRef = useRef<Map<string, Set<OrderChangeHandler>>>(new Map());

  const ensureChannel = useCallback((key: string, channelName: string, rf: RealtimeFilter) => {
    if (!channelsRef.current.has(key)) {
      const ch = createManagedChannel(key, channelName, rf, listenersRef);
      if (ch) channelsRef.current.set(key, ch);
    }
    return channelsRef.current.get(key);
  }, []);

  const removeChannelIfEmpty = useCallback((key: string) => {
    const set = listenersRef.current.get(key);
    if (!set || set.size === 0) {
      const ch = channelsRef.current.get(key);
      if (ch) {
        supabase.removeChannel(ch);
        channelsRef.current.delete(key);
      }
      listenersRef.current.delete(key);
    }
  }, []);

  // Global channel (admin pages — no filter)
  useEffect(() => {
    ensureChannel('*', 'orders-global', { event: '*', schema: 'public', table: 'orders' });
    // Poll connection status
    const check = setInterval(() => {
      const ch = channelsRef.current.get('*');
      setIsConnected(!!ch);
    }, 1000);
    return () => {
      const ch = channelsRef.current.get('*');
      if (ch) supabase.removeChannel(ch);
      channelsRef.current.delete('*');
      listenersRef.current.delete('*');
      clearInterval(check);
    };
  }, [ensureChannel]);

  const subscribeToOrder = useCallback((orderId: string, handler: OrderChangeHandler): (() => void) => {
    if (!listenersRef.current.has(orderId)) listenersRef.current.set(orderId, new Set());
    listenersRef.current.get(orderId)!.add(handler);
    ensureChannel(orderId, `order-${orderId}`, {
      event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}`,
    });
    return () => {
      const set = listenersRef.current.get(orderId);
      if (set) { set.delete(handler); removeChannelIfEmpty(orderId); }
    };
  }, [ensureChannel, removeChannelIfEmpty]);

  const subscribeToToken = useCallback((token: string, handler: OrderChangeHandler): (() => void) => {
    const key = `token-${token}`;
    if (!listenersRef.current.has(key)) listenersRef.current.set(key, new Set());
    listenersRef.current.get(key)!.add(handler);
    ensureChannel(key, `orders-token-${token}`, {
      event: '*', schema: 'public', table: 'orders', filter: `tracking_token=eq.${token}`,
    });
    return () => {
      const set = listenersRef.current.get(key);
      if (set) { set.delete(handler); removeChannelIfEmpty(key); }
    };
  }, [ensureChannel, removeChannelIfEmpty]);

  const subscribeToAllOrders = useCallback((handler: OrderChangeHandler): (() => void) => {
    if (!listenersRef.current.has('*')) listenersRef.current.set('*', new Set());
    listenersRef.current.get('*')!.add(handler);
    ensureChannel('*', 'orders-global', { event: '*', schema: 'public', table: 'orders' });
    return () => {
      const set = listenersRef.current.get('*');
      if (set) { set.delete(handler); removeChannelIfEmpty('*'); }
    };
  }, [ensureChannel, removeChannelIfEmpty]);

  const subscribeToTable = useCallback((tableName: string, handler: OrderChangeHandler, filter?: string): (() => void) => {
    const key = filter ? `tbl-${tableName}-${filter}` : `tbl-${tableName}`;
    if (!listenersRef.current.has(key)) listenersRef.current.set(key, new Set());
    listenersRef.current.get(key)!.add(handler);
    const rf: RealtimeFilter = { event: '*', schema: 'public', table: tableName };
    if (filter) rf.filter = filter;
    ensureChannel(key, `table-${tableName}${filter ? `-${filter}` : ''}`, rf);
    return () => {
      const set = listenersRef.current.get(key);
      if (set) { set.delete(handler); removeChannelIfEmpty(key); }
    };
  }, [ensureChannel, removeChannelIfEmpty]);

  return (
    <OrderRealtimeContext.Provider value={{ subscribeToOrder, subscribeToToken, subscribeToAllOrders, subscribeToTable, isConnected }}>
      {children}
    </OrderRealtimeContext.Provider>
  );
}
