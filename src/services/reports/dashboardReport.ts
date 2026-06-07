import { db } from '@/db';
import { sql, and, gte, lte, eq, desc, or, ilike, inArray } from 'drizzle-orm';
import { orders, orderItems } from '@/db/schema';

export async function getDashboardStats(startDate: Date, endDate: Date, status: string = 'all', payment: string = 'all', search: string = '') {
  const searchFilter = search ? or(
    ilike(orders.customerName, `%${search}%`),
    ilike(orders.customerPhone, `%${search}%`),
    ilike(orders.orderNumber, `%${search}%`),
    !isNaN(Number(search)) ? eq(orders.totalAmount, search) : undefined,
    inArray(orders.id, db.select({ id: orderItems.orderId }).from(orderItems).where(ilike(orderItems.itemName, `%${search}%`)))
  ) : undefined;

  // Extracting today's stats from the period given
  const statsRes = await db.select({
    sales: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    count: sql<number>`COUNT(${orders.id})`,
    activeOrders: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} NOT IN ('delivered', 'cancelled') THEN 1 ELSE 0 END), 0)`,
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

  const last10 = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    customerName: orders.customerName,
    totalAmount: orders.totalAmount,
    status: orders.status,
    createdAt: orders.createdAt
  })
  .from(orders)
  .where(and(
    eq(orders.isDeleted, false),
    gte(orders.createdAt, startDate),
    lte(orders.createdAt, endDate),
    status !== 'all' ? eq(orders.status, status as any) : undefined,
    payment !== 'all' ? eq(orders.paymentMethod, payment as any) : undefined,
    searchFilter
  ))
  .orderBy(desc(orders.createdAt))
  .limit(10);

  return {
    todaySales: Number(statsRes[0]?.sales || 0),
    todayOrders: Number(statsRes[0]?.count || 0),
    activeOrders: Number(statsRes[0]?.activeOrders || 0),
    lastOrders: last10
  };
}
