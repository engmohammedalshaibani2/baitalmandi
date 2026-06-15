export type AdminRole = 'developer' | 'manager' | 'order_manager'

const PAGE_ACCESS: Record<string, AdminRole[]> = {
  '/admin': ['developer', 'manager'],
  '/admin/orders': ['developer', 'manager', 'order_manager'],
  '/admin/menu': ['developer', 'manager'],
  '/admin/categories': ['developer', 'manager'],
  '/admin/offers': ['developer', 'manager'],
  '/admin/gallery': ['developer', 'manager'],
  '/admin/reviews': ['developer', 'manager'],
  '/admin/reports': ['developer', 'manager'],
  '/admin/settings': ['developer', 'manager'],
  '/admin/delivery': ['developer', 'manager'],
}

export const SIDEBAR_LINKS: { href: string; label: string; icon: string; roles: AdminRole[] }[] = [
  { href: '/admin', label: 'الرئيسية', icon: 'LayoutDashboard', roles: ['developer', 'manager'] },
  { href: '/admin/orders', label: 'الطلبات', icon: 'ShoppingBag', roles: ['developer', 'manager', 'order_manager'] },
  { href: '/admin/menu', label: 'الأطباق', icon: 'UtensilsCrossed', roles: ['developer', 'manager'] },
  { href: '/admin/categories', label: 'التصنيفات', icon: 'Tags', roles: ['developer', 'manager'] },
  { href: '/admin/offers', label: 'العروض', icon: 'Tags', roles: ['developer', 'manager'] },
  { href: '/admin/gallery', label: 'معرض الصور', icon: 'ImageIcon', roles: ['developer', 'manager'] },
  { href: '/admin/reviews', label: 'التقييمات', icon: 'Users', roles: ['developer', 'manager'] },
  { href: '/admin/reports', label: 'التقارير', icon: 'PieChart', roles: ['developer', 'manager'] },
  { href: '/admin/delivery', label: 'التوصيل', icon: 'Truck', roles: ['developer', 'manager'] },
  { href: '/admin/settings', label: 'الإعدادات', icon: 'Settings', roles: ['developer', 'manager'] },
]

export function isDeveloper(role: AdminRole | null | undefined): boolean {
  return role === 'developer';
}

export function canAccessPage(role: AdminRole | null | undefined, pathname: string): boolean {
  if (!role) return false

  if (role === 'developer') return true

  const allowed = PAGE_ACCESS[pathname]
  if (!allowed) return false

  return allowed.includes(role)
}

export function getAllowedSidebarLinks(role: AdminRole | null | undefined) {
  if (!role) return []
  if (role === 'developer') return SIDEBAR_LINKS
  return SIDEBAR_LINKS.filter(link => link.roles.includes(role))
}

export function getDefaultRedirect(role: AdminRole | null | undefined): string {
  if (!role) return '/admin/login'
  if (role === 'order_manager') return '/admin/orders'
  return '/admin'
}
