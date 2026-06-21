'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle, Eye, X, RefreshCw, ChevronLeft, ChevronRight, UserCircle, Shield } from 'lucide-react';
import { updateOrderStatus, cancelOrder, getCurrentAdmin } from './actions';
import type { AdminRole } from '@/lib/permissions';
import { useSettings } from '@/lib/settings-context';
import { getOrdersClient, type OrderListParams } from '@/repositories/orderRepository';
import { useOrderRealtime } from '@/realtime/OrderRealtimeProvider';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: '#f59e0b', icon: Clock },
  confirmed: { label: 'تم التأكيد', color: '#3b82f6', icon: CheckCircle },
  preparing: { label: 'جاري التحضير', color: '#8b5cf6', icon: Package },
  on_the_way: { label: 'في الطريق', color: '#06b6d4', icon: Truck },
  delivered: { label: 'تم التوصيل', color: '#10b981', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: '#ef4444', icon: XCircle },
};

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];

const PAGE_SIZE = 50;

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
  const { settings } = useSettings();
  const currency = settings['currency'] || 'ريال';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<{ full_name: string; role: AdminRole } | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { subscribeToAllOrders } = useOrderRealtime();

  useEffect(() => {
    getCurrentAdmin().then(data => {
      if (data) setAdminInfo(data);
    });
  }, []);

  const fetchOrders = useCallback(async (p: number = page) => {
    setLoading(true);
    try {
      const params: OrderListParams = {
        page: p,
        limit: PAGE_SIZE,
        status: statusFilter,
        search: searchQuery,
      };
      const result = await getOrdersClient(params);
      setOrders(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (err) {
      console.error('[Orders] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, searchQuery]);

  // Realtime updates: insert/update/delete triggers re-fetch
  useEffect(() => {
    const unsub = subscribeToAllOrders(() => {
      fetchOrders(page);
    });
    return unsub;
  }, [subscribeToAllOrders, fetchOrders, page]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleUpdateStatus = async (orderId: string, newStatus: string, currentVersion: number) => {
    setUpdatingId(orderId);
    try {
      const result = await updateOrderStatus(orderId, newStatus, currentVersion);
      if (result.success) fetchOrders(page);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء التحديث');
    }
    setUpdatingId(null);
  };

  const handleCancelOrder = async (orderId: string, currentVersion: number) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    setUpdatingId(orderId);
    try {
      const result = await cancelOrder(orderId, currentVersion);
      if (result.success) fetchOrders(page);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الإلغاء');
    }
    setUpdatingId(null);
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

  const roleLabels: Record<string, string> = {
    developer: 'مطور',
    manager: 'مدير',
    order_manager: 'مدير طلبات',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="title-gold" style={{ fontSize: '2rem', marginBottom: '5px' }}>إدارة الطلبات</h1>
          <p style={{ color: 'var(--text-secondary)' }}>إجمالي {total} طلب — الصفحة {page} من {totalPages}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {adminInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <UserCircle size={20} color="var(--gold)" />
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3 }}>{adminInfo.full_name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Shield size={10} /> {roleLabels[adminInfo.role] || adminInfo.role}
                </p>
              </div>
            </div>
          )}
          <button className="btn-secondary" onClick={() => fetchOrders(page)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} /> تحديث
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="glass-panel p-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <input
            type="text"
            className="input-field"
            placeholder="بحث (اسم، هاتف، رقم طلب)..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            style={{ minWidth: '220px', flex: 1 }}
          />
          <div className="flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button className={statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setStatusFilter('all')} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: '14px' }}>الكل</button>
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <button key={key} className={statusFilter === key ? 'btn-primary' : 'btn-secondary'} onClick={() => setStatusFilter(key)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: '14px' }}>
                {val.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination Header */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>صفحة {page} من {totalPages}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" disabled={page <= 1} onClick={() => fetchOrders(page - 1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px' }}>
              <ChevronRight size={16} /> السابقة
            </button>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => fetchOrders(page + 1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px' }}>
              التالية <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري التحميل...</div>
      ) : (
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
                    <p className="title-gold" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{order.total_amount} {currency}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{order.items?.length || 0} عناصر</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => setSelectedOrder(order)}>
                    <Eye size={16} /> التفاصيل
                  </button>
                  {nextStatus && order.status !== 'cancelled' && (
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, nextStatus, order.version)}
                    >
                      {updatingId === order.id ? 'جاري...' : `تحويل إلى: ${STATUS_MAP[nextStatus]?.label}`}
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button className="btn-danger" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => handleCancelOrder(order.id, order.version)}>
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
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
          <button className="btn-secondary" disabled={page <= 1} onClick={() => fetchOrders(page - 1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px' }}>
            <ChevronRight size={16} /> السابقة
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '0 12px' }}>{page} / {totalPages}</span>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={() => fetchOrders(page + 1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px' }}>
            التالية <ChevronLeft size={16} />
          </button>
        </div>
      )}

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
                  <span style={{ color: 'var(--gold)' }}>{item.total_price} {currency}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span>المجموع الفرعي:</span><span>{selectedOrder.subtotal} {currency}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: 'var(--text-secondary)' }}><span>رسوم التوصيل:</span><span>{selectedOrder.delivery_fee} {currency}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <span>الإجمالي:</span><span className="title-gold">{selectedOrder.total_amount} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
