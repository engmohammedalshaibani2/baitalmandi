import { syncQueue, queueLocks } from '@/lib/db/indexeddb';
import type { SyncQueueItem, TenantId } from '@/lib/pwa/types';
import {
  QUEUE_LOCK_TTL_MS,
  QUEUE_LOCK_HEARTBEAT_MS,
  BROADCAST_CHANNEL_NAME,
  BODY_TABLES_REQUIRING_IDEMPOTENCY,
} from '@/lib/pwa/types';

let isProcessing = false;
const SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function generateIdempotencyKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createIdempotencyKey(): string {
  return generateIdempotencyKey();
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function getSessionId(): string {
  return SESSION_ID;
}

/* ── Inject idempotency_key into request bodies for tables that need it ── */
function injectIdempotencyIntoBody(body: unknown, idempotencyKey: string, url: string): unknown {
  if (!body || typeof body !== 'object') return body;
  const isOrderRequest = BODY_TABLES_REQUIRING_IDEMPOTENCY.has(
    url.includes('orders') ? 'orders' : '',
  );
  if (!isOrderRequest) return body;
  const existing = body as Record<string, unknown>;
  if (existing.idempotency_key) return body;
  return { ...existing, idempotency_key: idempotencyKey };
}

/* ── Check if a 409 response is an idempotency duplicate ── */
async function isIdempotencyDuplicate(response: Response): Promise<boolean> {
  if (response.status !== 409) return false;
  try {
    const body = await response.clone().json();
    return (
      body?.code === '23505' ||
      body?.message?.includes('duplicate key') ||
      body?.message?.includes('unique constraint') ||
      false
    );
  } catch {
    return false;
  }
}

/* ── Exponential backoff delay ── */
function getBackoffDelay(item: SyncQueueItem): number {
  const base = 1000;
  const maxDelay = 30_000;
  const delay = Math.min(base * Math.pow(2, item.retryCount - 1), maxDelay);
  return delay + Math.random() * 1000;
}

/* ── Enqueue ── */
export async function enqueueRequest(
  request: {
    tenantId: TenantId;
    type: string;
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: unknown;
    idempotencyKey?: string;
    maxRetries?: number;
  },
): Promise<SyncQueueItem> {
  const idempotencyKey = request.idempotencyKey || generateIdempotencyKey();

  const existing = await syncQueue.getByIdempotency(idempotencyKey);
  if (existing && existing.status !== 'completed' && existing.status !== 'failed') {
    return existing;
  }

  const item: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    tenantId: request.tenantId,
    type: request.type,
    url: request.url,
    method: request.method,
    headers: request.headers,
    body: request.body,
    idempotencyKey,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: request.maxRetries ?? 3,
    status: 'pending',
  };

  try {
    await syncQueue.enqueue(item);
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.error('[SYNC] IndexedDB quota exceeded, performing emergency cleanup');
      const now = Date.now();
      await syncQueue.deleteOlderThan(now - 24 * 60 * 60 * 1000, ['completed', 'failed']);
      await syncQueue.enqueue(item);
    } else {
      console.error('[SYNC] Failed to enqueue item:', err);
      throw err;
    }
  }

  if (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'sync' in (navigator as any).serviceWorker
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('pwa-sync-queue');
    } catch {
      void tryProcessQueue();
    }
  } else {
    void tryProcessQueue();
  }

  return item;
}

/* ── Process queue with cross-tab lock ── */
export async function tryProcessQueue(): Promise<void> {
  if (!isOnline()) return;
  if (isProcessing) return;

  const acquired = await queueLocks.acquire({
    ownerId: SESSION_ID,
    acquiredAt: Date.now(),
    ttl: QUEUE_LOCK_TTL_MS,
    heartbeatAt: Date.now(),
  });

  if (!acquired) {
    return;
  }

  isProcessing = true;

  /* ── Heartbeat interval ── */
  const heartbeatHandle = setInterval(() => {
    void queueLocks.heartbeat(SESSION_ID);
  }, QUEUE_LOCK_HEARTBEAT_MS);

  /* ── Broadcast to other tabs that we own the queue ── */
  try {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.postMessage({ type: 'LOCK_ACQUIRED', ownerId: SESSION_ID });
    bc.close();
  } catch { /* BroadcastChannel may not be available */ }

  try {
    /* ── Step 1: Recover stale processing items ── */
    const staleItems = await syncQueue.getStaleProcessing();
    for (const stale of staleItems) {
      await syncQueue.updateStatus(stale.id, 'pending', 'Recovered from stale processing');
    }

    /* ── Step 2: Process all pending items ── */
    const pending = await syncQueue.getPending();
    for (const item of pending) {
      if (item.retryCount >= item.maxRetries) {
        await syncQueue.updateStatus(item.id, 'failed', 'Max retries exceeded');
        continue;
      }

      await syncQueue.upsertStatus(item.id, 'processing');

      try {
        const bodyWithIdempotency = injectIdempotencyIntoBody(item.body, item.idempotencyKey, item.url);

        const fetchOptions: RequestInit = {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            'x-idempotency-key': item.idempotencyKey,
            ...item.headers,
          },
        };

        if (bodyWithIdempotency && item.method !== 'GET' && item.method !== 'HEAD') {
          fetchOptions.body = JSON.stringify(bodyWithIdempotency);
        }

        const response = await fetch(item.url, fetchOptions);

        if (response.ok) {
          await syncQueue.updateStatus(item.id, 'completed');
        } else if (response.status === 409 && (await isIdempotencyDuplicate(response))) {
          await syncQueue.updateStatus(item.id, 'completed');
        } else if (response.status >= 400 && response.status < 500) {
          await syncQueue.updateStatus(item.id, 'failed', `HTTP ${response.status}`);
        } else {
          const backoff = getBackoffDelay(item);
          await syncQueue.updateStatus(item.id, 'pending', `HTTP ${response.status}, retry in ${backoff}ms`);
          await delay(backoff);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Network error';
        const backoff = getBackoffDelay(item);
        await syncQueue.updateStatus(item.id, 'pending', `${errorMsg}, retry in ${backoff}ms`);
        await delay(backoff);
      }
    }
  } finally {
    clearInterval(heartbeatHandle);
    isProcessing = false;
    await queueLocks.release(SESSION_ID);

    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({ type: 'LOCK_RELEASED', ownerId: SESSION_ID });
      bc.close();
    } catch { /* ignore */ }
  }
}

/* ── Listen for lock acquired by another tab ── */
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data?.type === 'LOCK_ACQUIRED' && event.data.ownerId !== SESSION_ID) {
        if (isProcessing) {
          isProcessing = false;
        }
      }
    };
  } catch { /* BroadcastChannel may not be available */ }
}

export async function getQueueLength(tenantId: TenantId): Promise<number> {
  const items = await syncQueue.getAll(tenantId);
  return items.filter(i => i.status === 'pending' || i.status === 'processing').length;
}

export async function getFailedItems(tenantId: TenantId): Promise<SyncQueueItem[]> {
  const items = await syncQueue.getAll(tenantId);
  return items.filter(i => i.status === 'failed');
}

/* ── Auto-retry on reconnect ── */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void tryProcessQueue();
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
