import { db } from '@/db';
import { sql, and, gte, lte, eq, desc, or, ilike } from 'drizzle-orm';
import { orders, orderItems, items } from '@/db/schema';

export async function getProductAnalytics(startDate: Date, endDate: Date, status: string = 'all', payment: string = 'all', search: string = '') {
  const searchFilter = search ? or(
    ilike(orderItems.itemName, `%${search}%`),
    ilike(orderItems.categoryName, `%${search}%`)
  ) : undefined;
  const topItems = await db.select({
    name: orderItems.itemName,
    category: orderItems.categoryName,
    quantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
    revenue: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)`
  })
  .from(orderItems)
  .innerJoin(orders, eq(orderItems.orderId, orders.id))
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
  .groupBy(orderItems.itemName, orderItems.categoryName)
  .orderBy(desc(sql`SUM(${orderItems.quantity})`));

  const categoriesSales = await db.select({
    name: orderItems.categoryName,
    quantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
    revenue: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
    ordersCount: sql<number>`COUNT(DISTINCT ${orders.id})`
  })
  .from(orderItems)
  .innerJoin(orders, eq(orderItems.orderId, orders.id))
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
  .groupBy(orderItems.categoryName)
  .orderBy(desc(sql`SUM(${orderItems.totalPrice})`));

  const allItemsRes = await db.select({ name: items.nameAr, isAvailable: items.isAvailable }).from(items);
  const soldNamesArray = topItems.map(i => (i.name || '').trim().toLowerCase());
  const unsold = allItemsRes.filter(i => {
    const dbName = (i.name || '').trim().toLowerCase();
    return !soldNamesArray.some(sold => sold.startsWith(dbName)) && i.isAvailable;
  });

  return {
    top10Qty: topItems.slice(0, 10),
    top10Rev: [...topItems].sort((a, b) => Number(b.revenue) - Number(a.revenue)).slice(0, 10),
    bottom10Qty: [...topItems].slice(-10).reverse(),
    unsold,
    categoriesSales
  };
}
