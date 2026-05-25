'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Tags, Settings, LogOut, Menu, X, Users, Image as ImageIcon } from 'lucide-react';

const ADMIN_LINKS = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'الطلبات', icon: ShoppingBag },
  { href: '/admin/menu', label: 'الأطباق', icon: UtensilsCrossed },
  { href: '/admin/categories', label: 'التصنيفات', icon: Tags },
  { href: '/admin/offers', label: 'العروض', icon: Tags },
  { href: '/admin/gallery', label: 'معرض الصور', icon: ImageIcon },
  { href: '/admin/reviews', label: 'التقييمات', icon: Users },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Check Auth
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !pathname.includes('/login')) {
        router.push('/admin/login');
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري التحميل...</div>;
  }

  // If login page, don't show sidebar
  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Mobile Overlay */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 50, background: 'var(--glass-bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
          className="md:hidden"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <aside style={{
        width: '280px',
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 className="title-gold" style={{ fontSize: '1.5rem', margin: 0 }}>لوحة التحكم</h2>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {ADMIN_LINKS.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
                  background: isActive ? 'var(--gold-faint)' : 'transparent',
                  color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        marginRight: isSidebarOpen ? '280px' : '0',
        padding: '40px 30px',
        transition: 'margin-right 0.3s ease-in-out',
        width: '100%'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
