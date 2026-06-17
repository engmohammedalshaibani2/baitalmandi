import 'whatwg-fetch';
import { describe, it, expect } from 'vitest';
import { OfferReportSchema, DashboardMetricsSchema, CustomerMetricsSchema, ProductMetricsSchema, SalesMetricsSchema, CompareReportSchema } from '@/schemas/reports';

describe('OfferReportSchema', () => {
  it('parses valid full data', () => {
    const result = OfferReportSchema.parse({
      totalDiscountAmount: 500,
      totalOriginalPrice: 2000,
      totalFinalPrice: 1500,
      offerOrderCount: 10,
      totalOrders: 100,
      totalRevenue: 5000,
      revenueBeforeDiscounts: 2000,
      revenueAfterDiscounts: 1500,
      avgDiscountPerOrder: 50,
      discountPercentage: 10,
      freeItemCount: 2,
      topOffers: [{ name: 'عرض 1', count: 5, revenue: 1000, discounts: 200 }],
      offerPercentage: '10.0',
    });
    expect(result.totalDiscountAmount).toBe(500);
    expect(result.revenueBeforeDiscounts).toBe(2000);
    expect(result.topOffers).toHaveLength(1);
  });

  it('parses empty data with defaults', () => {
    const result = OfferReportSchema.parse({
      totalDiscountAmount: 0,
      totalOriginalPrice: 0,
      totalFinalPrice: 0,
      offerOrderCount: 0,
      totalOrders: 0,
      totalRevenue: 0,
      revenueBeforeDiscounts: 0,
      revenueAfterDiscounts: 0,
      avgDiscountPerOrder: 0,
      discountPercentage: 0,
      freeItemCount: 0,
      topOffers: [],
      offerPercentage: '0',
    });
    expect(result.totalDiscountAmount).toBe(0);
    expect(result.topOffers).toEqual([]);
  });

  it('rejects missing required fields', () => {
    expect(() => OfferReportSchema.parse({})).toThrow();
  });

  it('rejects null revenueBeforeDiscounts', () => {
    expect(() => OfferReportSchema.parse({
      totalDiscountAmount: 0, totalOriginalPrice: 0, totalFinalPrice: 0,
      offerOrderCount: 0, totalOrders: 0, totalRevenue: 0,
      revenueBeforeDiscounts: null,
      revenueAfterDiscounts: 0, avgDiscountPerOrder: 0, discountPercentage: 0,
      freeItemCount: 0, topOffers: [], offerPercentage: '0',
    })).toThrow();
  });
});

describe('DashboardMetricsSchema', () => {
  it('parses valid dashboard metrics', () => {
    const result = DashboardMetricsSchema.parse({
      totalOrders: 100,
      pendingOrders: 10,
      deliveredOrders: 80,
      todayRevenue: 5000,
      totalRevenue: 50000,
    });
    expect(result.totalOrders).toBe(100);
  });

  it('parses all zeros', () => {
    const result = DashboardMetricsSchema.parse({
      totalOrders: 0, pendingOrders: 0, deliveredOrders: 0,
      todayRevenue: 0, totalRevenue: 0,
    });
    expect(result.todayRevenue).toBe(0);
  });
});

describe('CustomerMetricsSchema', () => {
  it('parses valid customer data', () => {
    const result = CustomerMetricsSchema.parse({
      customerName: 'أحمد',
      customerPhone: '777123456',
      orderCount: 5,
      totalSpent: 15000,
      avgOrderValue: 3000,
      lastOrderDate: '2026-06-17T10:00:00Z',
      firstOrderDate: '2026-01-01T08:00:00Z',
    });
    expect(result.customerName).toBe('أحمد');
    expect(result.orderCount).toBe(5);
  });

  it('handles empty strings', () => {
    const result = CustomerMetricsSchema.parse({
      customerName: '', customerPhone: '', orderCount: 0, totalSpent: 0,
      avgOrderValue: 0, lastOrderDate: '', firstOrderDate: '',
    });
    expect(result.customerName).toBe('');
  });
});

describe('ProductMetricsSchema', () => {
  it('parses valid product data', () => {
    const result = ProductMetricsSchema.parse({
      itemName: 'مندي لحم',
      categoryName: 'اللحوم',
      timesOrdered: 10,
      totalQuantitySold: 25,
      totalRevenue: 75000,
      avgUnitPrice: 3000,
    });
    expect(result.itemName).toBe('مندي لحم');
    expect(result.totalRevenue).toBe(75000);
  });
});

describe('SalesMetricsSchema', () => {
  it('parses valid sales data', () => {
    const result = SalesMetricsSchema.parse({
      saleDate: '2026-06-17',
      orderCount: 15,
      revenue: 45000,
      deliveryFees: 3000,
      cancelledCount: 1,
      cashOrders: 10,
      transferOrders: 3,
      walletOrders: 2,
    });
    expect(result.revenue).toBe(45000);
  });

  it('handles zero values', () => {
    const result = SalesMetricsSchema.parse({
      saleDate: '2026-06-17', orderCount: 0, revenue: 0, deliveryFees: 0,
      cancelledCount: 0, cashOrders: 0, transferOrders: 0, walletOrders: 0,
    });
    expect(result.orderCount).toBe(0);
  });
});

describe('CompareReportSchema', () => {
  it('parses valid compare data', () => {
    const result = CompareReportSchema.parse({
      currentSummary: { sales: 50000, count: 20, avgOrder: 2500 },
      previousSummary: { sales: 40000, count: 18, avgOrder: 2222 },
      salesGrowth: 25,
      ordersGrowth: 11.1,
      avgOrderGrowth: 12.5,
      payments: [{ method: 'cash', sales: 30000 }, { method: 'transfer', sales: 20000 }],
      hourly: [{ hour: '10', count: 5 }, { hour: '11', count: 8 }],
      daily: [{ day: 0, count: 3 }, { day: 1, count: 5 }],
    });
    expect(result.salesGrowth).toBe(25);
    expect(result.payments).toHaveLength(2);
  });

  it('handles empty arrays', () => {
    const result = CompareReportSchema.parse({
      currentSummary: { sales: 0, count: 0, avgOrder: 0 },
      previousSummary: { sales: 0, count: 0, avgOrder: 0 },
      salesGrowth: 0, ordersGrowth: 0, avgOrderGrowth: 0,
      payments: [], hourly: [], daily: [],
    });
    expect(result.payments).toEqual([]);
  });
});

import { toNumber, formatCurrency, formatNumber, formatPercent } from '@/lib/formatUtils';

describe('formatUtils', () => {
  describe('toNumber', () => {
    it('returns 0 for null/undefined', () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber(undefined)).toBe(0);
    });
    it('returns the number for valid numbers', () => {
      expect(toNumber(42)).toBe(42);
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-5)).toBe(-5);
    });
    it('parses numeric strings', () => {
      expect(toNumber('42')).toBe(42);
      expect(toNumber('3.14')).toBe(3.14);
    });
    it('returns fallback for NaN', () => {
      expect(toNumber('not-a-number')).toBe(0);
    });
    it('uses custom fallback', () => {
      expect(toNumber(null, 100)).toBe(100);
    });
  });

  describe('formatCurrency', () => {
    it('formats null/undefined as 0', () => {
      expect(formatCurrency(null)).toBe('0 ﷼');
      expect(formatCurrency(undefined)).toBe('0 ﷼');
    });
    it('formats valid numbers', () => {
      const result = formatCurrency(1500);
      expect(result).toContain('1,500');
      expect(result).toContain('﷼');
    });
  });

  describe('formatNumber', () => {
    it('formats null as 0', () => {
      expect(formatNumber(null)).toBe('0');
    });
    it('formats valid numbers', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });
  });

  describe('formatPercent', () => {
    it('formats null as 0%', () => {
      expect(formatPercent(null)).toBe('0.0%');
    });
    it('formats percentage correctly', () => {
      expect(formatPercent(12.5)).toBe('12.5%');
    });
  });
});
