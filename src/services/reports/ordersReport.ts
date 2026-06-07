import { db } from '@/db';
import { sql, and, gte, lte, eq, desc, or, ilike, inArray } from 'drizzle-orm';
import { orders, orderItems } from '@/db/schema';

export async function getOrdersReport(startDate: Date, endDate: Date, page: number = 1, limit: number = 50, status: string = 'all', payment: string = 'all', search: string = '') {
  const offset = (page - 1) * limit;

  const searchFilter = search ? or(
    ilike(orders.customerName, `%${search}%`),
    ilike(orders.customerPhone, `%${search}%`),
    ilike(orders.orderNumber, `%${search}%`),
    !isNaN(Number(search)) ? eq(orders.totalAmount, search) : undefined,
    inArray(orders.id, db.select({ id: orderItems.orderId }).from(orderItems).where(ilike(orderItems.itemName, `%${search}%`)))
  ) : undefined;
  
  const totalCountRes = await db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        eq(orders.isDeleted, false),
        status !== 'all' ? eq(orders.status, status as any) : undefined,
        payment !== 'all' ? eq(orders.paymentMethod, payment as any) : undefined,
        searchFilter
      )
  );

  const ordersData = await db.select()
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
    )
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch items for these orders
  const orderIds = ordersData.map(o => o.id);
  let allOrderItems: any[] = [];
  if (orderIds.length > 0) {
    const { orderItems } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');
    allOrderItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
  }

  const data = ordersData.map(order => ({
    ...order,
    items: allOrderItems.filter(item => item.orderId === order.id)
  }));

  return {
    data,
    total: Number(totalCountRes[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(totalCountRes[0]?.count || 0) / limit)
  };
}
