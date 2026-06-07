import { db } from '@/db';
import { sql, and, gte, lte, eq, or, ilike, inArray } from 'drizzle-orm';
import { orders, orderItems } from '@/db/schema';

export async function getSalesAnalytics(startDate: Date, endDate: Date, status: string = 'all', payment: string = 'all', search: string = '') {
  
  const searchFilter = search ? or(
    ilike(orders.customerName, `%${search}%`),
    ilike(orders.customerPhone, `%${search}%`),
    ilike(orders.orderNumber, `%${search}%`),
    // Allow searching by exact amount
    !isNaN(Number(search)) ? eq(orders.totalAmount, search) : undefined,
    // Search by item name
    inArray(orders.id, db.select({ id: orderItems.orderId }).from(orderItems).where(ilike(orderItems.itemName, `%${search}%`)))
  ) : undefined;
  // Summary Stats
  const summaryRes = await db.select({
    sales: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    subtotal: sql<number>`COALESCE(SUM(${orders.subtotal}), 0)`,
    count: sql<number>`COUNT(${orders.id})`,
    completedCount: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} = 'delivered' THEN 1 ELSE 0 END), 0)`,
    cancelledCount: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} = 'cancelled' THEN 1 ELSE 0 END), 0)`,
    avgOrder: sql<number>`COALESCE(AVG(${orders.totalAmount}), 0)`
  })
  .from(orders)
  .where(
    and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
      eq(orders.isDeleted, false),
      status !== 'all' ? eq(orders.status, status as any) : undefined,
      payment !== 'all' ? eq(orders.paymentMethod, payment as any) : undefined,
      searchFilter
    )
  );

  // Payments Breakdown
  const paymentRes = await db.select({
    method: orders.paymentMethod,
    sales: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    count: sql<number>`COUNT(${orders.id})`
  })
  .from(orders)
  .where(
    and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
      eq(orders.isDeleted, false),
      eq(orders.status, 'delivered'),
      status !== 'all' ? eq(orders.status, status as any) : undefined,
      payment !== 'all' ? eq(orders.paymentMethod, payment as any) : undefined,
      searchFilter
    )
  )
  .groupBy(orders.paymentMethod);

  // Peak Times
  const hourlyRes = await db.select({
    hour: sql<number>`EXTRACT(HOUR FROM ${orders.createdAt} AT TIME ZONE 'Asia/Riyadh')`,
    count: sql<number>`COUNT(${orders.id})`
  })
  .from(orders)
  .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate), eq(orders.isDeleted, false), searchFilter))
  .groupBy(sql`EXTRACT(HOUR FROM ${orders.createdAt} AT TIME ZONE 'Asia/Riyadh')`);

  const dailyRes = await db.select({
    day: sql<number>`EXTRACT(DOW FROM ${orders.createdAt})`,
    count: sql<number>`COUNT(${orders.id})`
  })
  .from(orders)
  .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate), eq(orders.isDeleted, false), searchFilter))
  .groupBy(sql`EXTRACT(DOW FROM ${orders.createdAt})`);

  return {
    summary: summaryRes[0],
    payments: paymentRes,
    hourly: hourlyRes,
    daily: dailyRes
  };
}
