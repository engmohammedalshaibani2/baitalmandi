/**
 * Unified Logging System
 * Used to log errors, warnings, and information with unified tagging.
 */

export type LogTag =
  | 'CREATE_ORDER'
  | 'ORDER_VALIDATION'
  | 'ORDER_ITEMS_INSERT'
  | 'RLS_CHECK'
  | 'TRACKING'
  | 'SUPABASE_ERROR'
  | 'DELIVERY_DEBUG'
  | 'DELIVERY_DISTANCE_VALIDATION'
  | 'MIN_ORDER_VALIDATION'
  | 'MIN_ORDER_CALCULATION'
  | 'MULTI_OFFER_CALC'
  | 'MULTI_OFFER_DB'
  | 'ORDER_NUMBER'
  | 'UPDATE_ORDER_STATUS';

export const logger = {
  info(tag: LogTag, message: string, data?: any) {
    const dataStr = data ? ` | Data: ${typeof data === 'object' ? JSON.stringify(data) : data}` : '';
    console.log(`[${tag}] [INFO] ${message}${dataStr}`);
  },

  warn(tag: LogTag, message: string, data?: any) {
    const dataStr = data ? ` | Data: ${typeof data === 'object' ? JSON.stringify(data) : data}` : '';
    console.warn(`[${tag}] [WARN] ${message}${dataStr}`);
  },

  error(tag: LogTag, message: string, err?: any) {
    let errDetail = '';
    if (err) {
      if (err instanceof Error) {
        errDetail = ` | Error: ${err.message}\nStack: ${err.stack}`;
      } else if (typeof err === 'object') {
        errDetail = ` | Error details: ${JSON.stringify(err)}`;
      } else {
        errDetail = ` | Error: ${String(err)}`;
      }
    }
    console.error(`[${tag}] [ERROR] ${message}${errDetail}`);
  },
};
