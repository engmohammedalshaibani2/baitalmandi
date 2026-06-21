import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // تقييد Middleware ليعمل فقط على مسارات الإدارة والتقارير
  matcher: ['/admin', '/admin/:path*', '/api/reports/:path*', '/api/admin/:path*'],
};
