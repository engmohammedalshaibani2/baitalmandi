import { supabase } from '@/lib/supabase';

export async function getAdminName(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('admin_users')
    .select('full_name')
    .eq('auth_user_id', userId)
    .maybeSingle();
  return data?.full_name || null;
}

export async function getDashboardStats() {
  const todayISO = new Date().toISOString().slice(0, 10);

  const [
    { count: totalOrders },
    { data: todayRevenue },
    { count: activeItems },
    { count: pendingOrders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount').gte('created_at', todayISO),
    supabase.from('items').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const todayTotal = (todayRevenue || []).reduce((sum: number, r: any) => sum + Number(r.total_amount || 0), 0);

  return {
    totalOrders: totalOrders || 0,
    todayRevenue: todayTotal,
    activeItems: activeItems || 0,
    pendingOrders: pendingOrders || 0,
  };
}

export async function archiveDeliveredOrders() {
  const { error } = await supabase
    .from('orders')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('status', 'delivered');
  if (error) throw error;
}
