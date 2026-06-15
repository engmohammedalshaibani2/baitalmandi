'use server'

import { createClient } from '@/utils/supabase/server'
import { canAccessPage, type AdminRole } from '@/lib/permissions'

export async function getCurrentAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('admin_users')
    .select('id, full_name, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return data as { id: string; full_name: string; role: AdminRole } | null
}

async function checkAdminAccess(requiredRoles: AdminRole[]): Promise<{ supabase: any; admin: NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>> }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مصرح بالدخول')

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, full_name, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!admin) throw new Error('غير مصرح بالدخول')

  const role = admin.role as AdminRole
  if (!requiredRoles.includes(role) && role !== 'developer') {
    throw new Error('ليس لديك صلاحية للقيام بهذه العملية')
  }

  return { supabase, admin: admin as NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>> }
}

const STATUS_MAP_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  preparing: 'جاري التحضير',
  on_the_way: 'في الطريق',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
}

export async function updateOrderStatus(orderId: string, newStatus: string, currentVersion: number) {
  const { supabase, admin } = await checkAdminAccess(['developer', 'manager', 'order_manager'])

  const { data: order } = await supabase
    .from('orders')
    .select('status, version')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('الطلب غير موجود')

  const oldStatus = order.status

  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      version: currentVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('version', currentVersion)
    .select()
    .single()

  if (error) throw new Error('حدث خطأ أثناء التحديث')
  if (!updated) throw new Error('تم تعديل الطلب من شخص آخر، يرجى إعادة المحاولة')

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by_admin_id: admin.id,
  })

  await supabase.from('audit_logs').insert({
    entity_id: orderId,
    entity_type: 'order',
    action: newStatus === 'cancelled' ? 'cancel' : 'status_change',
    details: `تم تغيير حالة الطلب من "${STATUS_MAP_AR[oldStatus] || oldStatus}" إلى "${STATUS_MAP_AR[newStatus] || newStatus}"`,
    admin_id: admin.id,
  })

  return { success: true }
}

export async function cancelOrder(orderId: string, currentVersion: number) {
  const { supabase, admin } = await checkAdminAccess(['developer', 'manager', 'order_manager'])

  const { data: order } = await supabase
    .from('orders')
    .select('status, version')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('الطلب غير موجود')
  if (order.status === 'delivered' || order.status === 'cancelled') {
    throw new Error('لا يمكن إلغاء طلب تم توصيله أو إلغاؤه مسبقاً')
  }

  const oldStatus = order.status

  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      version: currentVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('version', currentVersion)
    .select()
    .single()

  if (error) throw new Error('حدث خطأ أثناء الإلغاء')
  if (!updated) throw new Error('تم تعديل الطلب من شخص آخر، يرجى إعادة المحاولة')

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    old_status: oldStatus,
    new_status: 'cancelled',
    changed_by_admin_id: admin.id,
  })

  await supabase.from('audit_logs').insert({
    entity_id: orderId,
    entity_type: 'order',
    action: 'cancel',
    details: 'تم إلغاء الطلب',
    admin_id: admin.id,
  })

  return { success: true }
}
