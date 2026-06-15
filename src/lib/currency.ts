export function formatCurrency(amount: number, currency?: string): string {
  const c = currency || 'ريال';
  return `${amount.toLocaleString('ar-YE')} ${c}`;
}

export function formatCurrencyShort(amount: number, currency?: string): string {
  const c = currency || 'ريال';
  return `${amount.toLocaleString('ar-YE')} ${c}`;
}

export function getCurrencySymbol(currency?: string): string {
  return currency || 'ريال';
}
