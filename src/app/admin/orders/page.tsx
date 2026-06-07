'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Clock, CheckCircle, Truck, XCircle, Eye, X, RefreshCw } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: '#f59e0b', icon: Clock },
  confirmed: { label: 'تم التأكيد', color: '#3b82f6', icon: CheckCircle },
  preparing: { label: 'جاري التحضير', color: '#8b5cf6', icon: Package },
  on_the_way: { label: 'في الطريق', color: '#06b6d4', icon: Truck },
  delivered: { label: 'تم التوصيل', color: '#10b981', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: '#ef4444', icon: XCircle },
};

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  subtotal: string;
  delivery_fee: string;
  total_amount: string;
  order_method: string;
  status: string;
  version: number;
  created_at: string;
  items: any[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    let query = supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('is_deleted', false)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [statusFilter]);

  const updateStatus = async (orderId: string, newStatus: string, currentVersion: number) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, version: currentVersion + 1, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('version', currentVersion);

    if (error) {
      alert('حدث خطأ أثناء التحديث. قد يكون الطلب قد تم تعديله من شخص آخر.');
    } else {
      // Log status change
      const order = orders.find(o => o.id === orderId);
      await supabase.from('order_status_history').insert({ order_id: orderId, old_status: order?.status, new_status: newStatus });
      await supabase.from('audit_logs').insert({
        entity_id: orderId,
        entity_type: 'order',
        action: newStatus === 'cancelled' ? 'cancel' : 'status_change',
        details: `تغيير الحالة إلى ${STATUS_MAP[newStatus]?.label}`
      });
    }
    setUpdatingId(null);
    fetchOrders();
  };

  const cancelOrder = async (orderId: string, currentVersion: number) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    await updateStatus(orderId, 'cancelled', currentVersion);
  };

  const getNextStatus = (current: string): string | null => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري التحميل...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '5px' }}>إدارة الطلبات</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{orders.length} طلب</p>
        </div>
        <button className="btn-secondary" onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={18} /> تحديث
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        <button className={statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setStatusFilter('all')} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: '14px' }}>الكل</button>
        {Object.entries(STATUS_MAP).map(([key, val]) => (
          <button key={key} className={statusFilter === key ? 'btn-primary' : 'btn-secondary'} onClick={() => setStatusFilter(key)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: '14px' }}>
            {val.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {orders.map(order => {
          const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
          const StatusIcon = statusInfo.icon;
          const nextStatus = getNextStatus(order.status);

          return (
            <div key={order.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontFamily: 'monospace', direction: 'ltr' }}>{order.order_number}</h3>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: `${statusInfo.color}20`, color: statusInfo.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <StatusIcon size={14} /> {statusInfo.label}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {order.customer_name} · {order.customer_phone}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    {formatDate(order.created_at)} · {order.order_method === 'website' ? 'من الموقع' : 'واتساب'}
                  </p>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p className="title-gold" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{order.total_amount} ريال</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{order.items?.length || 0} عناصر</p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => setSelectedOrder(order)}>
                  <Eye size={16} /> التفاصيل
                </button>
                {nextStatus && order.status !== 'cancelled' && (
                  <button
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                    disabled={updatingId === order.id}
                    onClick={() => updateStatus(order.id, nextStatus, order.version)}
                  >
                    {updatingId === order.id ? 'جاري...' : `تحويل إلى: ${STATUS_MAP[nextStatus]?.label}`}
                  </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button className="btn-danger" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => cancelOrder(order.id, order.version)}>
                    <XCircle size={16} /> إلغاء
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
            <p style={{ fontSize: '1.2rem' }}>لا توجد طلبات</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedOrder(null)}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '30px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: 'var(--gold)', fontSize: '1.3rem' }}>تفاصيل الطلب</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', marginBottom: '10px', direction: 'ltr', textAlign: 'right' }}>{selectedOrder.order_number}</p>
              <p><strong>العميل:</strong> {selectedOrder.customer_name}</p>
              <p><strong>الهاتف:</strong> {selectedOrder.customer_phone}</p>
              {selectedOrder.delivery_address && <p><strong>العنوان:</strong> {selectedOrder.delivery_address}</p>}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginBottom: '15px' }}>
              <h3 style={{ marginBottom: '10px', fontSize: '1rem' }}>العناصر:</h3>
              {selectedOrder.items?.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>{item.item_name} ({item.size_label}) × {item.quantity}</span>
                  <span style={{ color: 'var(--gold)' }}>{item.total_price} ريال</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>المجموع الفرعي:</span><span>{selectedOrder.subtotal} ريال</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                <span>رسوم التوصيل:</span><span>{selectedOrder.delivery_fee} ريال</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <span>الإجمالي:</span><span className="title-gold">{selectedOrder.total_amount} ريال</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
