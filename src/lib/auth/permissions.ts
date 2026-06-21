import { createClient } from '@/utils/supabase/server';
import { logAuthAction } from './logger';
import { redirect } from 'next/navigation';
import { isAdmin, isOrderManager, canAccessRoute, type AdminRole, getDefaultRedirect } from '@/lib/permissions';

import { cache } from 'react';

export const getCurrentUserRole = cache(async function getCurrentUserRole(): Promise<{ role: AdminRole | null; user: any | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { role: null, user: null };
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return { role: null, user };
    }

    // Normalize roles (e.g. order-manager to order_manager)
    let role = data.role as string;
    if (role === 'order-manager') role = 'order_manager';
    
    return { role: role as AdminRole, user };
  } catch (error) {
    console.error('[getCurrentUserRole] Error:', error);
    return { role: null, user: null };
  }
});

export async function canAccessAdminPage(pathname: string) {
  const { role, user } = await getCurrentUserRole();
  
  if (!user) {
    logAuthAction('UNAUTHORIZED_ACCESS', { userId: 'guest', route: pathname });
    redirect('/admin/login');
  }

  if (!role) {
    logAuthAction('UNAUTHORIZED_ACCESS', { userId: user.id, route: pathname, reason: 'No admin role found' });
    redirect('/admin/login');
  }

  const normalizedRole = role === 'order-manager' ? 'order_manager' : role;

  // Redirect to orders if an order manager accesses the root /admin or any unauthorized page
  if (isOrderManager(normalizedRole)) {
    if (pathname === '/admin' || !canAccessRoute(normalizedRole, pathname)) {
      logAuthAction('ADMIN_REDIRECT', { userId: user.id, role: normalizedRole, from: pathname, to: '/admin/orders' });
      redirect('/admin/orders');
    }
  }

  if (!canAccessRoute(normalizedRole, pathname)) {
    logAuthAction('UNAUTHORIZED_ACCESS', { userId: user.id, role: normalizedRole, route: pathname });
    const fallback = getDefaultRedirect(normalizedRole);
    logAuthAction('ADMIN_REDIRECT', { userId: user.id, role: normalizedRole, from: pathname, to: fallback });
    redirect(fallback);
  }

  logAuthAction('ADMIN_ACCESS', { userId: user.id, role: normalizedRole, route: pathname });
  return { role: normalizedRole, user };
}
