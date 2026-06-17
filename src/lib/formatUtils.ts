/** Safe number formatting — never throws on null/undefined. */
export function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Number.isNaN(value) ? fallback : value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

/** Format currency safely — ar-EG locale, wraps toNumber. */
export function formatCurrency(value: unknown, suffix = '﷼'): string {
  return `${toNumber(value).toLocaleString('ar-EG')} ${suffix}`;
}

/** Format a plain number safely. */
export function formatNumber(value: unknown): string {
  return toNumber(value).toLocaleString('ar-EG');
}

/** Format percentage safely. */
export function formatPercent(value: unknown, decimals = 1): string {
  return `${toNumber(value).toFixed(decimals)}%`;
}

/** Guard: if value is null/undefined/NaN return fallback, else call fn. */
export function safe<T>(value: T | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' && Number.isNaN(value)) return fallback;
  return value;
}
