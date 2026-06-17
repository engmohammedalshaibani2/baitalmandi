import type { SyncQueueItem, TenantId, QueueLock } from '@/lib/pwa/types';
import { STALE_PROCESSING_TIMEOUT_MS } from '@/lib/pwa/types';

const DB_NAME = 'baitalmandi-pwa';
const DB_VERSION = 2;

interface StoreSchema {
  name: string;
  keyPath: string;
  indexes?: { name: string; keyPath: string | string[]; options?: { unique?: boolean; multiEntry?: boolean } }[];
}

const STORES: StoreSchema[] = [
  {
    name: 'orders',
    keyPath: 'id',
    indexes: [{ name: 'tenant_idx', keyPath: 'tenantId' }],
  },
  {
    name: 'cart',
    keyPath: 'id',
    indexes: [{ name: 'tenant_idx', keyPath: 'tenantId' }],
  },
  {
    name: 'syncQueue',
    keyPath: 'id',
    indexes: [
      { name: 'tenant_idx', keyPath: 'tenantId' },
      { name: 'status_idx', keyPath: 'status' },
      { name: 'idempotency_idx', keyPath: 'idempotencyKey', options: { unique: false } },
    ],
  },
  {
    name: 'tenantMeta',
    keyPath: 'key',
  },
  {
    name: 'queueLocks',
    keyPath: 'id',
    indexes: [{ name: 'owner_idx', keyPath: 'ownerId' }],
  },
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store.name)) {
          const os = db.createObjectStore(store.name, { keyPath: store.keyPath });
          for (const idx of store.indexes || []) {
            os.createIndex(idx.name, idx.keyPath, idx.options);
          }
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<any>,
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}

export const idb = {
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    return withStore<T | undefined>(storeName, 'readonly', (store) => store.get(key));
  },

  async getAll<T>(
    storeName: string,
    tenantId?: TenantId,
  ): Promise<T[]> {
    if (tenantId) {
      return withStore<T[]>(storeName, 'readonly', (store) => {
        const index = store.index('tenant_idx');
        return index.getAll(tenantId);
      });
    }
    return withStore<T[]>(storeName, 'readonly', (store) => store.getAll());
  },

  async put<T>(storeName: string, value: T): Promise<void> {
    await withStore<void>(storeName, 'readwrite', (store) => store.put(value));
  },

  async delete(storeName: string, key: string): Promise<void> {
    await withStore<void>(storeName, 'readwrite', (store) => store.delete(key));
  },

  async clear(storeName: string, tenantId?: TenantId): Promise<void> {
    if (tenantId) {
      const items = await this.getAll<{ id: string }>(storeName, tenantId);
      for (const item of items) {
        await this.delete(storeName, item.id);
      }
      return;
    }
    await withStore<void>(storeName, 'readwrite', (store) => store.clear());
  },

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: string,
  ): Promise<T[]> {
    return withStore<T[]>(storeName, 'readonly', (store) => {
      const index = store.index(indexName);
      return index.getAll(value);
    });
  },

  async getOneByIndex<T>(
    storeName: string,
    indexName: string,
    value: string,
  ): Promise<T | undefined> {
    return withStore<T | undefined>(storeName, 'readonly', (store) => {
      const index = store.index(indexName);
      return index.get(value);
    });
  },

  async getAllKeys(storeName: string): Promise<IDBValidKey[]> {
    return withStore<IDBValidKey[]>(storeName, 'readonly', (store) => store.getAllKeys());
  },
};

/* ── Data access helpers (typed, tenant-isolated) ── */

export const offlineOrders = {
  async get(orderId: string) {
    return idb.get<{ id: string; tenantId: TenantId; data: unknown; syncedAt: number; version: number }>('orders', orderId);
  },
  async getAll(tenantId: TenantId) {
    return idb.getAll<{ id: string; tenantId: TenantId; data: unknown; syncedAt: number; version: number }>('orders', tenantId);
  },
  async save(order: { id: string; tenantId: TenantId; data: unknown; syncedAt: number; version: number }) {
    return idb.put('orders', order);
  },
  async delete(orderId: string) {
    return idb.delete('orders', orderId);
  },
  async deleteOlderThan(timestamp: number) {
    const store = 'orders';
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      const req = os.openCursor();
      let deleted = 0;
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const item = cursor.value as { syncedAt?: number };
          if (item.syncedAt && item.syncedAt < timestamp) {
            cursor.delete();
            deleted++;
          }
          cursor.continue();
        } else {
          db.close();
          resolve();
        }
      };
      req.onerror = () => { reject(req.error); db.close(); };
    });
  },
};

export const offlineCart = {
  async get(cartId: string) {
    return idb.get<{ id: string; tenantId: TenantId; data: unknown; updatedAt: number }>('cart', cartId);
  },
  async getAll(tenantId: TenantId) {
    return idb.getAll<{ id: string; tenantId: TenantId; data: unknown; updatedAt: number }>('cart', tenantId);
  },
  async save(item: { id: string; tenantId: TenantId; data: unknown; updatedAt: number }) {
    return idb.put('cart', item);
  },
  async delete(cartId: string) {
    return idb.delete('cart', cartId);
  },
  async clear(tenantId: TenantId) {
    return idb.clear('cart', tenantId);
  },
  async deleteAbandonedOlderThan(timestamp: number) {
    const store = 'cart';
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      const req = os.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const item = cursor.value as { updatedAt?: number };
          if (item.updatedAt && item.updatedAt < timestamp) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          db.close();
          resolve();
        }
      };
      req.onerror = () => { reject(req.error); db.close(); };
    });
  },
};

export const syncQueue = {
  async get(queueId: string) {
    return idb.get<SyncQueueItem>('syncQueue', queueId);
  },
  async getAll(tenantId: TenantId) {
    return idb.getByIndex<SyncQueueItem>('syncQueue', 'tenant_idx', tenantId);
  },
  async getPending() {
    return idb.getByIndex<SyncQueueItem>('syncQueue', 'status_idx', 'pending');
  },
  async getStaleProcessing() {
    const all = await idb.getByIndex<SyncQueueItem>('syncQueue', 'status_idx', 'processing');
    const now = Date.now();
    return all.filter(item =>
      item.processingStartedAt &&
      (now - item.processingStartedAt) > STALE_PROCESSING_TIMEOUT_MS,
    );
  },
  async enqueue(item: SyncQueueItem) {
    return idb.put('syncQueue', item);
  },
  async updateStatus(id: string, status: SyncQueueItem['status'], error?: string) {
    const item = await this.get(id);
    if (item) {
      item.status = status;
      item.retryCount = status === 'processing' ? item.retryCount + 1 : item.retryCount;
      if (item.status === 'processing') {
        item.processingStartedAt = Date.now();
      }
      if (error) item.error = error;
      return idb.put('syncQueue', item);
    }
  },
  async upsertStatus(id: string, status: SyncQueueItem['status'], error?: string) {
    const item = await this.get(id);
    if (!item) return;
    const oldStatus = item.status;
    item.status = status;
    if (item.status === 'processing' && oldStatus !== 'processing') {
      item.retryCount = (item.retryCount || 0) + 1;
    }
    if (item.status === 'processing') {
      item.processingStartedAt = Date.now();
    }
    if (error) item.error = error;
    return idb.put('syncQueue', item);
  },
  async delete(queueId: string) {
    return idb.delete('syncQueue', queueId);
  },
  async getByIdempotency(key: string) {
    return idb.getOneByIndex<SyncQueueItem>('syncQueue', 'idempotency_idx', key);
  },
  async deleteOlderThan(timestamp: number, statusFilter?: SyncQueueItem['status'][]) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const os = tx.objectStore('syncQueue');
      const req = os.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const item = cursor.value as SyncQueueItem;
          const matchStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(item.status);
          if (matchStatus && item.timestamp && item.timestamp < timestamp) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          db.close();
          resolve();
        }
      };
      req.onerror = () => { reject(req.error); db.close(); };
    });
  },
};

export const queueLocks = {
  async acquire(lock: QueueLock): Promise<boolean> {
    const existing = await idb.get<QueueLock>('queueLocks', 'main');
    const now = Date.now();
    if (existing && existing.ownerId !== lock.ownerId) {
      if ((now - existing.acquiredAt) < existing.ttl && (now - existing.heartbeatAt) < existing.ttl) {
        return false;
      }
    }
    await idb.put('queueLocks', { ...lock, id: 'main' });
    return true;
  },
  async release(ownerId: string): Promise<void> {
    const lock = await idb.get<QueueLock>('queueLocks', 'main');
    if (lock && lock.ownerId === ownerId) {
      await idb.delete('queueLocks', 'main');
    }
  },
  async heartbeat(ownerId: string): Promise<void> {
    const lock = await idb.get<QueueLock>('queueLocks', 'main');
    if (lock && lock.ownerId === ownerId) {
      lock.heartbeatAt = Date.now();
      await idb.put('queueLocks', lock);
    }
  },
  async getCurrent(): Promise<QueueLock | undefined> {
    return idb.get<QueueLock>('queueLocks', 'main');
  },
};

export const tenantMeta = {
  async get(key: string) {
    return idb.get<{ key: string; value: unknown }>('tenantMeta', key);
  },
  async set(key: string, value: unknown) {
    return idb.put('tenantMeta', { key, value } as any);
  },
  async delete(key: string) {
    return idb.delete('tenantMeta', key);
  },
};
