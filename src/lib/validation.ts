const YEMENI_PHONE_REGEX = /^(?:(?:\+?967)?(?:70|71|73|77|78)\d{7}|(?:0?70|0?71|0?73|0?77|0?78)\d{7}|(?:70|71|73|77|78)\d{7})$/;

export function validateYemeniPhone(phone: string): { valid: boolean; error?: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleaned) {
    return { valid: false, error: 'رقم الهاتف مطلوب' };
  }
  if (YEMENI_PHONE_REGEX.test(cleaned)) {
    return { valid: true };
  }
  return { valid: false, error: 'يرجى إدخال رقم هاتف يمني صحيح (9 أرقام، يبدأ بـ 70, 71, 73, 77, 78)' };
}

export function normalizeYemeniPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (/^(?:70|71|73|77|78)\d{7}$/.test(cleaned)) {
    return cleaned;
  }
  const withoutCountry = cleaned.replace(/^(?:\+?967|0)/, '');
  if (/^(?:70|71|73|77|78)\d{7}$/.test(withoutCountry)) {
    return withoutCountry;
  }
  return cleaned;
}

export function validateFullName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'الاسم مطلوب' };
  }
  const words = trimmed.split(/\s+/);
  if (words.length < 2) {
    return { valid: false, error: 'يرجى إدخال الاسم الثنائي على الأقل' };
  }
  return { valid: true };
}

export function validateDeliveryAddress(address: string): { valid: boolean; error?: string } {
  const trimmed = address.trim();
  if (!trimmed) {
    return { valid: false, error: 'عنوان التوصيل مطلوب' };
  }
  if (trimmed.length < 10) {
    return { valid: false, error: 'يرجى إدخال عنوان توصيل دقيق (10 أحرف على الأقل)' };
  }
  return { valid: true };
}

export function validateMinOrderAmount(subtotal: number, minAmount: number): { valid: boolean; error?: string } {
  if (minAmount > 0 && subtotal < minAmount) {
    return { valid: false, error: `الحد الأدنى للطلب هو ${minAmount.toLocaleString('ar-YE')}` };
  }
  return { valid: true };
}
