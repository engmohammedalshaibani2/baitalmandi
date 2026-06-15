'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Tags, Settings, LogOut, Menu, X, Users,
  Image as ImageIcon, PieChart, UserCircle, Shield, Truck
} from 'lucide-react';
import { SIDEBAR_LINKS, type AdminRole } from '@/lib/permissions';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [adminName, setAdminName] = useState('');
  const supabase = createClient();
  const isLoginPage = pathname.includes('/login');

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
    loadAdminInfo();
  }, []);

  useEffect(() => {
    setLoading(false)
  }, [role])

  async function loadAdminInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('admin_users')
        .select('role, full_name')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (data) {
        setRole(data.role as AdminRole)
        setAdminName(data.full_name)
      }
    } catch (err) {
      console.error('[layout] loadAdminInfo error', err)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري التحميل...</div>;
  }

  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  const allowedLinks = role === 'developer'
    ? SIDEBAR_LINKS
    : SIDEBAR_LINKS.filter(link => link.roles.includes(role!));

  const icons: Record<string, React.ElementType> = {
    LayoutDashboard, ShoppingBag, UtensilsCrossed, Tags, ImageIcon, Users, PieChart, Settings, Truck
  };

  const roleLabels: Record<string, string> = {
    developer: 'مطور',
    manager: 'مدير',
    order_manager: 'مدير طلبات',
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] print:block print:bg-white text-[var(--text-primary)] print:text-black">
      {!isSidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          style={{ position: 'fixed', top: '90px', right: '20px', zIndex: 30, background: 'var(--glass-bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
          className="md:hidden"
        >
          <Menu size={24} />
        </button>
      )}

      {isSidebarOpen && (
        <div 
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 35, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar z-40 fixed md:sticky print:hidden flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`} style={{
        width: '280px',
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        padding: '30px 20px',
        right: 0,
        top: '72px',
        height: 'calc(100vh - 72px)',
        transition: 'transform 0.3s ease-in-out',
        overflowY: 'auto',
        alignSelf: 'flex-start'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 className="title-gold" style={{ fontSize: '1.5rem', margin: 0 }}>لوحة التحكم</h2>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
          background: 'rgba(212,175,55,0.05)', marginBottom: '24px', border: '1px solid rgba(212,175,55,0.1)'
        }}>
          <div style={{ background: 'var(--gold-faint)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
            <UserCircle size={24} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName || 'المشرف'}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} />
              {roleLabels[role || ''] || role}
            </p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {allowedLinks.map(link => {
            const Icon = icons[link.icon] || LayoutDashboard;
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

      <main className="admin-main pt-24 md:pt-10 px-5 pb-10 print:p-0 print:m-0 print:w-full print:max-w-none print:block flex-1 w-full" style={{
        minWidth: 0,
        transition: 'all 0.3s ease-in-out'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
