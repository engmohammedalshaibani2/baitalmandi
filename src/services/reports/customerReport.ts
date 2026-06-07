import { db } from '@/db';
import { sql, and, gte, lte, eq, desc, or, ilike } from 'drizzle-orm';
import { orders } from '@/db/schema';

export async function getCustomerAnalytics(startDate: Date, endDate: Date, status: string = 'all', payment: string = 'all', search: string = '') {
  const searchFilter = search ? or(
    ilike(orders.customerName, `%${search}%`),
    ilike(orders.customerPhone, `%${search}%`)
  ) : undefined;
  
  const customers = await db.select({
    phone: orders.customerPhone,
    name: sql<string>`MAX(${orders.customerName})`,
    spend: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    ordersCount: sql<number>`COUNT(${orders.id})`,
    lastOrder: sql<Date>`MAX(${orders.createdAt})`,
    avgOrder: sql<number>`COALESCE(AVG(${orders.totalAmount}), 0)`
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
  .groupBy(orders.customerPhone)
  .orderBy(desc(sql`SUM(${orders.totalAmount})`))
  .limit(50);

  return customers;
}
