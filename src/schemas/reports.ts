import { z } from 'zod';

// === OFFER METRICS ===
export const TopOfferSchema = z.object({
  name: z.string(),
  count: z.number(),
  revenue: z.number(),
  discounts: z.number(),
});
export type TopOffer = z.infer<typeof TopOfferSchema>;

export const OfferReportSchema = z.object({
  totalDiscountAmount: z.number(),
  totalOriginalPrice: z.number(),
  totalFinalPrice: z.number(),
  offerOrderCount: z.number(),
  totalOrders: z.number(),
  totalRevenue: z.number(),
  avgDiscountPerOrder: z.number(),
  discountPercentage: z.number(),
  revenueBeforeDiscounts: z.number(),
  revenueAfterDiscounts: z.number(),
  freeItemCount: z.number(),
  topOffers: z.array(TopOfferSchema),
  offerPercentage: z.string(),
});
export type OfferReport = z.infer<typeof OfferReportSchema>;

// === DASHBOARD METRICS ===
export const DashboardMetricsSchema = z.object({
  totalOrders: z.number(),
  pendingOrders: z.number(),
  deliveredOrders: z.number(),
  todayRevenue: z.number(),
  totalRevenue: z.number(),
});
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;

export const DashboardReportSchema = z.object({
  todaySales: z.number(),
  todayOrders: z.number(),
  activeOrders: z.number(),
  lastOrders: z.array(z.object({
    id: z.string(),
    orderNumber: z.string(),
    customerName: z.string(),
    totalAmount: z.union([z.string(), z.number()]),
    status: z.string(),
    createdAt: z.string(),
  })),
});
export type DashboardReport = z.infer<typeof DashboardReportSchema>;

// === SALES METRICS ===
export const SalesMetricsSchema = z.object({
  saleDate: z.string(),
  orderCount: z.number(),
  revenue: z.number(),
  deliveryFees: z.number(),
  cancelledCount: z.number(),
  cashOrders: z.number(),
  transferOrders: z.number(),
  walletOrders: z.number(),
});
export type SalesMetrics = z.infer<typeof SalesMetricsSchema>;

// === CUSTOMER METRICS ===
export const CustomerMetricsSchema = z.object({
  customerName: z.string(),
  customerPhone: z.string(),
  orderCount: z.number(),
  totalSpent: z.number(),
  avgOrderValue: z.number(),
  lastOrderDate: z.string(),
  firstOrderDate: z.string(),
});
export type CustomerMetrics = z.infer<typeof CustomerMetricsSchema>;

export const CustomerReportSchema = z.array(z.object({
  name: z.string(),
  phone: z.string(),
  ordersCount: z.number(),
  spend: z.number(),
  avgOrder: z.number(),
  lastOrder: z.string(),
}));
export type CustomerReport = z.infer<typeof CustomerReportSchema>;

// === PRODUCT METRICS ===
export const ProductMetricsSchema = z.object({
  itemName: z.string(),
  categoryName: z.string(),
  timesOrdered: z.number(),
  totalQuantitySold: z.number(),
  totalRevenue: z.number(),
  avgUnitPrice: z.number(),
});
export type ProductMetrics = z.infer<typeof ProductMetricsSchema>;

export const ProductReportSchema = z.object({
  top10Qty: z.array(z.object({ name: z.string(), quantity: z.number() })),
  top10Rev: z.array(z.object({ name: z.string(), revenue: z.number() })),
  bottom10Qty: z.array(z.object({ name: z.string(), quantity: z.number() })),
  unsold: z.array(z.object({ name: z.string() })),
  categoriesSales: z.array(z.object({
    name: z.string(), ordersCount: z.number(), quantity: z.number(), revenue: z.number(),
  })),
});
export type ProductReport = z.infer<typeof ProductReportSchema>;

// === COMPARE REPORT ===
export const SummarySectionSchema = z.object({
  sales: z.number(),
  count: z.number(),
  avgOrder: z.number(),
});
export type SummarySection = z.infer<typeof SummarySectionSchema>;

export const CompareReportSchema = z.object({
  currentSummary: SummarySectionSchema,
  previousSummary: SummarySectionSchema,
  salesGrowth: z.number(),
  ordersGrowth: z.number(),
  avgOrderGrowth: z.number(),
  payments: z.array(z.object({ method: z.string(), sales: z.number() })),
  hourly: z.array(z.object({ hour: z.string(), count: z.number() })),
  daily: z.array(z.object({ day: z.number(), count: z.number() })),
});
export type CompareReport = z.infer<typeof CompareReportSchema>;
