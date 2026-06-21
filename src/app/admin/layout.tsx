import { canAccessAdminPage } from '@/lib/auth/permissions';
import AdminLayoutClient from './AdminLayoutClient';
import { headers } from 'next/headers';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/admin';
  
  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  const { role, user } = await canAccessAdminPage(pathname);
  const adminName = user?.user_metadata?.full_name || 'المشرف';

  return (
    <AdminLayoutClient initialRole={role!} adminName={adminName}>
      {children}
    </AdminLayoutClient>
  );
}

