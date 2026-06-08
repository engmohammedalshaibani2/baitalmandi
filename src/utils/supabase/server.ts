import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const { domain, ...cleanOptions } = options;
            cleanOptions.secure = process.env.NODE_ENV === 'production';
            cookieStore.set(name, value, cleanOptions);
          });
        } catch (error) {
          console.error('cookieStore.set error in server.ts:', error);
          // setAll called from Server Component — safe to ignore if middleware handles session refresh
        }
      },
    },
  });
};
