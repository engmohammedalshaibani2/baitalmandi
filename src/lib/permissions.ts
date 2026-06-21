export type AdminRole = 'developer' | 'manager' | 'admin' | 'order_manager' | 'order-manager';

export const ADMIN_ROUTES = [
  '/admin',
  '/admin/orders',
  '/admin/menu',
  '/admin/categories',
  '/admin/offers',
  '/admin/gallery',
  '/admin/reviews',
  '/admin/reports',
  '/admin/settings',
  '/admin/delivery',
];

export const ORDER_MANAGER_ROUTES = [
  '/admin/orders',
];

export const SIDEBAR_LINKS = [
  { href: '/admin', label: 'الرئيسية', icon: 'LayoutDashboard', roles: ['developer', 'manager', 'admin'] },
  { href: '/admin/orders', label: 'الطلبات', icon: 'ShoppingBag', roles: ['developer', 'manager', 'admin', 'order_manager', 'order-manager'] },
  { href: '/admin/menu', label: 'الأطباق', icon: 'UtensilsCrossed', roles: ['developer', 'manager', 'admin'] },
  { href: '/admin/categories', label: 'التصنيفات', icon: 'Tags', roles: ['developer', 'manager', 'admin'] },
  { href: '/admin/offers', label: 'العروض', icon: 'Tags', roles: ['developer', 'manager', 'admin'] },
  { href: '/admin/gallery', label: 'معرض الصور', icon: 'ImageIcon', roles: ['developer', 'manager', 'admin'] },
  { href: '/admin/reviews', label: 'التقييمات', icon: 'Users', roles: ['developer', 'manager', 'admin'] },
  { href: '/admin/reports', label: 'التقارير', icon: 'PieChart', roles: ['developer', 'manager', 'admin'] },
  { href: '/admin/delivery', label: 'التوصيل', icon: 'Truck', roles: ['developer', 'manager', 'admin'] },
  { href: '/admin/settings', label: 'الإعدادات', icon: 'Settings', roles: ['developer', 'manager', 'admin'] },
];

export function isOrderManager(role: AdminRole | null | undefined): boolean {
  return role === 'order_manager' || role === 'order-manager';
}

export function isAdmin(role: AdminRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'developer' || role === 'manager' || role === 'admin';
}

export function isDeveloper(role: AdminRole | null | undefined): boolean {
  return role === 'developer';
}

export function canAccessRoute(role: AdminRole | null | undefined, pathname: string): boolean {
  if (!role) return false;
  
  const normalizedRole = role === 'order-manager' ? 'order_manager' : role;
  
  if (isAdmin(normalizedRole)) return true;
  
  if (isOrderManager(normalizedRole)) {
    // Check if the pathname starts with any of the order manager routes (e.g. /admin/orders or sub-paths, or specific APIs)
    const isAllowedPage = ORDER_MANAGER_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
    const isAllowedApi = pathname.startsWith('/api/admin/orders') || pathname.startsWith('/api/reports/orders');
    return isAllowedPage || isAllowedApi;
  }
  
  return false;
}

export function getAllowedSidebarLinks(role: AdminRole | null | undefined) {
  if (!role) return [];
  const normalizedRole = role === 'order-manager' ? 'order_manager' : role;
  if (isAdmin(normalizedRole)) {
    return SIDEBAR_LINKS;
  }
  return SIDEBAR_LINKS.filter(link => link.roles.includes(normalizedRole));
}

export function getDefaultRedirect(role: AdminRole | null | undefined): string {
  if (!role) return '/admin/login';
  const normalizedRole = role === 'order-manager' ? 'order_manager' : role;
  if (isOrderManager(normalizedRole)) return '/admin/orders';
  return '/admin';
}
