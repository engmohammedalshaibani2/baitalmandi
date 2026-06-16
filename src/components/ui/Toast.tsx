'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_DURATION = 1500;

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: '✓',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
    icon: '✕',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    icon: '⚠',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    icon: 'ℹ',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    console.log('[TOAST_DISMISSED]', { toastId: id });
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const toast: ToastMessage = { id, type, title, message };

    console.log('[TOAST_SHOWN]', { toastId: id, type, title, messageLength: message?.length || 0 });

    setToasts(prev => [...prev, toast]);

    const timer = setTimeout(() => {
      removeToast(id);
    }, TOAST_DURATION);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  const handleContainerClick = useCallback(() => {
    if (toasts.length > 0) {
      removeToast(toasts[toasts.length - 1].id);
    }
  }, [toasts, removeToast]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (toasts.length > 0) {
        removeToast(toasts[toasts.length - 1].id);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
          width: 'auto',
          maxWidth: '90vw',
        }}
      >
        {toasts.map(toast => {
          const style = typeStyles[toast.type];
          return (
            <div
              key={toast.id}
              onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
              style={{
                direction: 'rtl',
                pointerEvents: 'auto',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 20px',
                borderRadius: '14px',
                background: style.bg,
                border: `1px solid ${style.border}`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                animation: 'toastSlideIn 0.3s ease-out',
                minWidth: '280px',
                maxWidth: '500px',
              }}
            >
              <span style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, flexShrink: 0,
              }}>
                {style.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {toast.title}
                </div>
                {toast.message && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {toast.message}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
