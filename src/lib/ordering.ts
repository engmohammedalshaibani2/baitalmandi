import { supabase } from '@/lib/supabase';

export type OrderingStrategy = 'append' | 'prepend';

/**
 * Calculate the next automatic sort_order for an entity.
 *
 * - 'append' (items): max(existing) + 1  →  new items appear at the end
 * - 'prepend' (categories, gallery): new item gets 1, existing shift up
 */
export async function getNextSortOrder(
  table: string,
  strategy: OrderingStrategy,
  filterField?: string,
  filterValue?: string,
): Promise<{ sortOrder: number; needsReindex: boolean }> {
  let query = supabase.from(table).select('sort_order');

  if (filterField && filterValue) {
    query = query.eq(filterField, filterValue);
  }

  const { data } = await query.order('sort_order', { ascending: true });

  const existing = (data || []).map((r: any) => Number(r.sort_order)).filter((n: number) => !isNaN(n));

  if (strategy === 'prepend') {
    if (existing.length === 0) return { sortOrder: 1, needsReindex: false };
    const min = Math.min(...existing);
    if (min > 1) return { sortOrder: min - 1, needsReindex: false };
    return { sortOrder: 1, needsReindex: true };
  }

  // append: put at the end
  if (existing.length === 0) return { sortOrder: 1, needsReindex: false };
  return { sortOrder: Math.max(...existing) + 1, needsReindex: false };
}

/**
 * Shift all sort_order values in a table up by 1 (add 1).
 * Used when prepending a new record with sort_order = 1.
 */
export async function shiftSortOrdersUp(
  table: string,
  filterField?: string,
  filterValue?: string,
): Promise<void> {
  let query = supabase.from(table).select('id, sort_order');

  if (filterField && filterValue) {
    query = query.eq(filterField, filterValue);
  }

  const { data } = await query;

  if (!data || data.length === 0) return;

  for (const row of data) {
    await supabase
      .from(table)
      .update({ sort_order: Number(row.sort_order) + 1 })
      .eq('id', row.id);
  }
}

/**
 * Reindex sort_order values within a group to ensure sequential numbers without gaps.
 * Applied per category for items, or globally for categories/gallery.
 */
export async function reindexSortOrders(
  table: string,
  filterField?: string,
  filterValue?: string,
  startFrom: number = 1,
): Promise<void> {
  let query = supabase
    .from(table)
    .select('id, sort_order')
    .order('sort_order', { ascending: true });

  if (filterField && filterValue) {
    query = query.eq(filterField, filterValue);
  }

  const { data } = await query;

  if (!data || data.length === 0) return;

  for (let i = 0; i < data.length; i++) {
    const expected = startFrom + i;
    const current = Number(data[i].sort_order);
    if (current !== expected) {
      await supabase
        .from(table)
        .update({ sort_order: expected })
        .eq('id', data[i].id);
    }
  }

  console.log(`[MENU_ORDER_RECALCULATED] Reindexed ${table}`, {
    filterField,
    filterValue,
    itemsCount: data.length,
    startFrom,
  });
}
