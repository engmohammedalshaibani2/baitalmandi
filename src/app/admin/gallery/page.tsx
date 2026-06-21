import { canAccessAdminPage } from '@/lib/auth/permissions';
import ClientPage from './ClientPage';

export default async function Page() {
  await canAccessAdminPage('/admin/gallery');
  return <ClientPage />;
}
