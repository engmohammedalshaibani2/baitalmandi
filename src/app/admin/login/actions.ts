'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  // Before logging in, clear any existing bad cookies just in case
  const cookieStore = await cookies();
  cookieStore.getAll().forEach((c) => {
    if (c.name.includes('supabase') || c.name.includes('sb-')) {
      cookieStore.delete(c.name);
    }
  });

  const supabase = await createClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login action error:', error.message);
    return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  }

  console.log('Login action success, returning success flag');
  return { success: true };
}
