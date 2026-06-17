'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/lib/settings-context';
import { useOrderRealtime } from '@/realtime/OrderRealtimeProvider';
import { getDashboardStats, getAdminName, archiveDeliveredOrders } from '@/repositories/adminRepository';

export default function AdminDashboard() {
  const { settings } = useSettings();
  const currency = settings['currency'] || 'ريال';
  const fmt = (amount: number) => `${amount.toLocaleString('ar-YE')} ${currency}`;
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeItems: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const { subscribeToAllOrders } = useOrderRealtime();

  const fetchStats = async () => {
    const stats = await getDashboardStats();

    setStats({
      totalOrders: stats.totalOrders,
      totalRevenue: stats.todayRevenue,
      activeItems: stats.activeItems,
      pendingOrders: stats.pendingOrders
    });
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  // Realtime: refresh counters when any order changes
  useEffect(() => {
    const unsub = subscribeToAllOrders(() => { fetchStats(); });
    return unsub;
  }, [subscribeToAllOrders]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل الإحصائيات...</div>;

  const statCards = [
    { title: 'إجمالي الطلبات', value: stats.totalOrders, icon: ShoppingBag, color: 'var(--gold)' },
    { title: 'مبيعات اليوم', value: fmt(stats.totalRevenue), icon: DollarSign, color: '#10b981' },
    { title: 'طلبات قيد الانتظار', value: stats.pendingOrders, icon: TrendingUp, color: '#ef4444' },
    { title: 'الأطباق النشطة', value: stats.activeItems, icon: Users, color: '#3b82f6' },
  ];

  return (
    <div>
      <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '30px' }}>لوحة التحكم</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>{card.title}</p>
                  <p className="title-gold" style={{ fontSize: '1.8rem', fontWeight: 900 }}>{card.value}</p>
                </div>
                <div style={{ padding: '12px', borderRadius: '12px', background: `${card.color}15` }}>
                  <Icon size={24} color={card.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/admin/orders" className="glass-card" style={{ padding: '20px', borderRadius: '14px', textDecoration: 'none', display: 'block', transition: '0.2s' }}>
          <h3 style={{ color: 'var(--gold)', marginBottom: '6px' }}>إدارة الطلبات</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>عرض وإدارة جميع الطلبات</p>
        </Link>
        <Link href="/admin/reports" className="glass-card" style={{ padding: '20px', borderRadius: '14px', textDecoration: 'none', display: 'block', transition: '0.2s' }}>
          <h3 style={{ color: 'var(--gold)', marginBottom: '6px' }}>التقارير</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>تحليل المبيعات والتقارير</p>
        </Link>
        <Link href="/admin/menu" className="glass-card" style={{ padding: '20px', borderRadius: '14px', textDecoration: 'none', display: 'block', transition: '0.2s' }}>
          <h3 style={{ color: 'var(--gold)', marginBottom: '6px' }}>إدارة القائمة</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>الأطباق والأصناف</p>
        </Link>
      </div>
    </div>
  );
}
