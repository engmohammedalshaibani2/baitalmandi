export type TenantId = string;

export interface SyncQueueItem {
  id: string;
  tenantId: TenantId;
  type: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  idempotencyKey: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  processingStartedAt?: number;
}

export interface QueueLock {
  ownerId: string;
  acquiredAt: number;
  ttl: number;
  heartbeatAt: number;
}

export type CacheStrategy = 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate' | 'NetworkOnly';

export interface CacheRule {
  pattern: RegExp;
  strategy: CacheStrategy;
  cacheName: string;
  maxAge?: number;
}

export interface CacheInvalidationEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  payload?: Record<string, unknown>;
}

export interface TableCacheMapping {
  table: string;
  cacheKeys: string[];
}

export type PwaInstallStatus = 'idle' | 'installable' | 'installed' | 'unsupported';

export interface PwaState {
  installStatus: PwaInstallStatus;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  syncQueueLength: number;
}

/** Configuration for automatic IndexedDB cleanup */
export interface CleanupConfig {
  syncQueueCompletedMaxAgeMs: number;
  syncQueueFailedMaxAgeMs: number;
  cartAbandonedMaxAgeMs: number;
  ordersMaxAgeMs: number;
  cleanupIntervalMs: number;
}

export const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  syncQueueCompletedMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  syncQueueFailedMaxAgeMs: 30 * 24 * 60 * 60 * 1000,
  cartAbandonedMaxAgeMs: 24 * 60 * 60 * 1000,
  ordersMaxAgeMs: 90 * 24 * 60 * 60 * 1000,
  cleanupIntervalMs: 60 * 60 * 1000,
};

export const STALE_PROCESSING_TIMEOUT_MS = 30_000;
export const QUEUE_LOCK_TTL_MS = 30_000;
export const QUEUE_LOCK_HEARTBEAT_MS = 10_000;
export const BROADCAST_CHANNEL_NAME = 'pwa-sync-queue';

export const BODY_TABLES_REQUIRING_IDEMPOTENCY = new Set([
  'orders',
]);
