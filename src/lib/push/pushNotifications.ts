import { supabase } from '@/lib/supabase';
import type { TenantId } from '@/lib/pwa/types';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData.split('').map((c) => c.charCodeAt(0)));
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  return permission;
}

export function getPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function subscribeToPush(
  tenantId: TenantId,
  vapidKey?: string,
): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      return existing;
    }

    const key = vapidKey || VAPID_PUBLIC_KEY;
    if (!key) {
      console.warn('[PushNotifications] No VAPID public key configured');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    });

    await saveSubscription(tenantId, subscription);
    return subscription;
  } catch (err) {
    console.error('[PushNotifications] Subscribe failed:', err);
    return null;
  }
}

export async function unsubscribeFromPush(
  tenantId: TenantId,
): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    await deleteSubscription(tenantId, subscription);
    await subscription.unsubscribe();
    return true;
  } catch (err) {
    console.error('[PushNotifications] Unsubscribe failed:', err);
    return false;
  }
}

async function saveSubscription(
  tenantId: TenantId,
  subscription: PushSubscription,
): Promise<void> {
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      tenant_id: tenantId,
      endpoint: subscription.endpoint,
      auth_key: subscription.toJSON().keys?.auth || '',
      p256dh_key: subscription.toJSON().keys?.p256dh || '',
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id,endpoint' },
  );
  if (error) {
    console.warn('[PushNotifications] Failed to save subscription:', error.message);
  }
}

async function deleteSubscription(
  tenantId: TenantId,
  subscription: PushSubscription,
): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('endpoint', subscription.endpoint);
  if (error) {
    console.warn('[PushNotifications] Failed to delete subscription:', error.message);
  }
}
