'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, TrendingUp, Users, DollarSign, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeItems: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // These are simple aggregations. For production, consider doing this in a database view or RPC.
      const today = new Date();
      today.setHours(0,0,0,0);
      const todayISO = today.toISOString();

      const [
        { count: ordersCount },
        { data: ordersData },
        { count: itemsCount },
        { count: pendingCount }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').gte('created_at', todayISO),
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      const revenue = ordersData?.reduce((acc, order) => acc + Number(order.total_amount), 0) || 0;

      setStats({
        totalOrders: ordersCount || 0,
        totalRevenue: revenue,
        activeItems: itemsCount || 0,
        pendingOrders: pendingCount || 0
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) return <div>جاري تحميل الإحصائيات...</div>;

  const statCards = [
    { title: 'إجمالي الطلبات', value: stats.totalOrders, icon: ShoppingBag, color: 'var(--gold)' },
    { title: 'مبيعات اليوم', value: `${stats.totalRevenue} ريال`, icon: DollarSign, color: '#10b981' },
    { title: 'طلبات قيد الانتظار', value: stats.pendingOrders, icon: TrendingUp, color: '#ef4444' },
    { title: 'الأطباق النشطة', value: stats.activeItems, icon: Users, color: '#3b82f6' },
  ];

  return (
    <div>
      <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '10px' }}>لوحة القيادة</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>مرحباً بك في نظام إدارة مطعم بيت المندي.</p>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {statCards.map((card, i) => (
          <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: `rgba(${parseInt(card.color.slice(1,3),16)},${parseInt(card.color.slice(3,5),16)},${parseInt(card.color.slice(5,7),16)}, 0.1)`, padding: '16px', borderRadius: '16px', color: card.color }}>
              <card.icon size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '5px' }}>{card.title}</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text-primary)' }}>إجراءات سريعة</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Link href="/admin/orders" className="glass-card hover-effect" style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <ShoppingBag size={32} color="var(--gold)" />
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>إدارة الطلبات</span>
        </Link>
        <Link href="/admin/menu" className="glass-card hover-effect" style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <UtensilsCrossed size={32} color="var(--gold)" />
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>تحديث المنيو</span>
        </Link>
        <Link href="/admin/categories" className="glass-card hover-effect" style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <ShoppingBag size={32} color="var(--gold)" />
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>إدارة التصنيفات</span>
        </Link>
        <Link href="/admin/offers" className="glass-card hover-effect" style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <TrendingUp size={32} color="var(--gold)" />
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>إدارة العروض</span>
        </Link>
      </div>
    </div>
  );
}
