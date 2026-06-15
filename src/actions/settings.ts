'use server';

import { createClient } from '@/utils/supabase/server';
import { isDeveloper, type AdminRole } from '@/lib/permissions';

async function checkDeveloperAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('غير مصرح بالدخول');

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, full_name, role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!admin) throw new Error('غير مصرح بالدخول');

  const role = admin.role as AdminRole;
  if (!isDeveloper(role)) {
    throw new Error('ليس لديك صلاحية للقيام بهذه العملية');
  }

  return supabase;
}

export async function updateDeveloperSettings(values: { developer_company_name: string; developer_company_url: string }) {
  const supabase = await checkDeveloperAccess();

  const upsertData = [
    { setting_key: 'developer_company_name', value: values.developer_company_name.trim() },
    { setting_key: 'developer_company_url', value: values.developer_company_url.trim() },
  ];

  const { error } = await supabase
    .from('site_settings')
    .upsert(upsertData, { onConflict: 'setting_key' });

  if (error) {
    console.error('[UPDATE_DEVELOPER_SETTINGS] Failed:', error);
    throw new Error('فشل حفظ إعدادات المطور');
  }

  console.log('[UPDATE_DEVELOPER_SETTINGS] Success:', values);
  return { success: true };
}
