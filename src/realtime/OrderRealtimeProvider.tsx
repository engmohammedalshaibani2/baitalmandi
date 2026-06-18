'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type OrderChangePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
};

type OrderChangeHandler = (payload: OrderChangePayload) => void;

interface OrderRealtimeContextValue {
  subscribeToOrder: (orderId: string, handler: OrderChangeHandler) => () => void;
  subscribeToToken: (token: string, handler: OrderChangeHandler) => () => void;
  subscribeToAllOrders: (handler: OrderChangeHandler) => () => void;
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

export function OrderRealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const listenersRef = useRef<Map<string, Set<OrderChangeHandler>>>(new Map());
  const connectionCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const broadcastToListeners = useCallback((key: string, payload: OrderChangePayload) => {
    const handlers = listenersRef.current.get(key);
    if (handlers) handlers.forEach((h) => h(payload));
  }, []);

  const subscribeChannel = useCallback((key: string, channelName: string, rf: RealtimeFilter) => {
    if (channelsRef.current.has(key)) return channelsRef.current.get(key)!;
    if (typeof window === 'undefined') return null;

    const ch = supabase.channel(channelName);
    (ch as any)
      .on('postgres_changes', rf, (payload: any) => {
        const changePayload: OrderChangePayload = {
          eventType: payload.eventType,
          new: payload.new || {},
          old: payload.old || {},
        };

        // Always broadcast to exact key match
        broadcastToListeners(key, changePayload);

        // For order events on the global channel, also broadcast to per-order listeners
        if (key === '*') {
          const orderId = changePayload.new?.id || changePayload.old?.id;
          if (orderId) {
            broadcastToListeners(orderId, changePayload);
          }
        }
      })
      .subscribe();

    channelsRef.current.set(key, ch);
    return ch;
  }, [broadcastToListeners]);

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

  // Single global channel for ALL order changes
  useEffect(() => {
    subscribeChannel('*', 'orders-global', { event: '*', schema: 'public', table: 'orders' });

    connectionCheckRef.current = setInterval(() => {
      const ch = channelsRef.current.get('*');
      setIsConnected(!!ch);
    }, 5000);

    return () => {
      const ch = channelsRef.current.get('*');
      if (ch) supabase.removeChannel(ch);
      channelsRef.current.delete('*');
      listenersRef.current.delete('*');
      if (connectionCheckRef.current) clearInterval(connectionCheckRef.current);
    };
  }, [subscribeChannel]);

  const addListener = useCallback((key: string) => {
    if (!listenersRef.current.has(key)) listenersRef.current.set(key, new Set());
  }, []);

  const subscribeToOrder = useCallback((orderId: string, handler: OrderChangeHandler): (() => void) => {
    addListener(orderId);
    listenersRef.current.get(orderId)!.add(handler);
    // Uses the global orders channel — no new channel created per order
    return () => {
      const set = listenersRef.current.get(orderId);
      if (set) { set.delete(handler); removeChannelIfEmpty(orderId); }
    };
  }, [addListener, removeChannelIfEmpty]);

  const subscribeToToken = useCallback((token: string, handler: OrderChangeHandler): (() => void) => {
    const key = `token-${token}`;
    addListener(key);
    listenersRef.current.get(key)!.add(handler);
    subscribeChannel(key, `orders-token-${token}`, {
      event: '*', schema: 'public', table: 'orders', filter: `tracking_token=eq.${token}`,
    });
    return () => {
      const set = listenersRef.current.get(key);
      if (set) { set.delete(handler); removeChannelIfEmpty(key); }
    };
  }, [addListener, subscribeChannel, removeChannelIfEmpty]);

  const subscribeToAllOrders = useCallback((handler: OrderChangeHandler): (() => void) => {
    addListener('*');
    listenersRef.current.get('*')!.add(handler);
    subscribeChannel('*', 'orders-global', { event: '*', schema: 'public', table: 'orders' });
    return () => {
      const set = listenersRef.current.get('*');
      if (set) { set.delete(handler); removeChannelIfEmpty('*'); }
    };
  }, [addListener, subscribeChannel, removeChannelIfEmpty]);

  const subscribeToTable = useCallback((tableName: string, handler: OrderChangeHandler, filter?: string): (() => void) => {
    const key = filter ? `tbl-${tableName}-${filter}` : `tbl-${tableName}`;
    addListener(key);
    listenersRef.current.get(key)!.add(handler);
    const rf: RealtimeFilter = { event: '*', schema: 'public', table: tableName };
    if (filter) rf.filter = filter;
    subscribeChannel(key, `table-${tableName}${filter ? `-${filter}` : ''}`, rf);
    return () => {
      const set = listenersRef.current.get(key);
      if (set) { set.delete(handler); removeChannelIfEmpty(key); }
    };
  }, [addListener, subscribeChannel, removeChannelIfEmpty]);

  return (
    <OrderRealtimeContext.Provider value={{ subscribeToOrder, subscribeToToken, subscribeToAllOrders, subscribeToTable, isConnected }}>
      {children}
    </OrderRealtimeContext.Provider>
  );
}
