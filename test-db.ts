import { db } from './src/db';
import { items, orderItems } from './src/db/schema';

async function run() {
  const allItems = await db.select({ name: items.nameAr }).from(items);
  console.log("ITEMS:", allItems);

  const soldItems = await db.select({ name: orderItems.itemName, size: orderItems.sizeLabel }).from(orderItems);
  console.log("SOLD ITEMS:", soldItems);
  process.exit(0);
}
run();
