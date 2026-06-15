'use client';
import { useState, useMemo, useEffect } from 'react';
import { Activity, TrendingUp, ShoppingBag, Users, Box, Download, Printer, FileSpreadsheet, Filter, Tag, Truck } from 'lucide-react';
import QRCode from 'qrcode';
import { printReport } from '@/lib/printReport';
import { exportExcelReport } from '@/lib/exportExcel';
import { supabase } from '@/lib/supabase';

import DashboardTab from '@/components/admin/reports/DashboardTab';
import OrdersTab from '@/components/admin/reports/OrdersTab';
import ProductsTab from '@/components/admin/reports/ProductsTab';
import SummaryTab from '@/components/admin/reports/SummaryTab';
import CustomersTab from '@/components/admin/reports/CustomersTab';
import InvoicesTab from '@/components/admin/reports/InvoicesTab';
import AuditLogsTab from '@/components/admin/reports/AuditLogsTab';
import OffersTab from '@/components/admin/reports/OffersTab';
import DeliveryAnalyticsTab from '@/components/admin/reports/DeliveryAnalyticsTab';

type ReportPeriod = 'today' | 'this_week' | 'this_month' | 'custom';
type ReportTab = 'dashboard' | 'orders' | 'products' | 'customers' | 'summary' | 'offers' | 'invoices' | 'audit' | 'delivery';

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState<ReportTab>('dashboard');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [adminName, setAdminName] = useState('مدير النظام');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      QRCode.toDataURL(window.location.href).then(setQrCodeDataUrl).catch(console.error);
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('admin_users').select('full_name').eq('auth_user_id', user.id).maybeSingle().then(({ data }) => {
        if (data?.full_name) setAdminName(data.full_name);
      });
    });
  }, []);
  
  // Additional Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { currentStart, currentEnd, prevStart, prevEnd } = useMemo(() => {
    let startDate = new Date();
    let endDate = new Date();
    let pStart = new Date();
    let pEnd = new Date();
    
    endDate.setHours(23, 59, 59, 999);

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
      pStart.setDate(startDate.getDate() - 1);
      pStart.setHours(0, 0, 0, 0);
      pEnd.setDate(endDate.getDate() - 1);
      pEnd.setHours(23, 59, 59, 999);
    } else if (period === 'this_week') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      
      pStart = new Date(startDate);
      pStart.setDate(pStart.getDate() - 7);
      pEnd = new Date(endDate);
      pEnd.setDate(pEnd.getDate() - 7);
    } else if (period === 'this_month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      pStart.setMonth(startDate.getMonth() - 1);
      pStart.setDate(1);
      pStart.setHours(0, 0, 0, 0);
      pEnd.setDate(0); 
      pEnd.setHours(23, 59, 59, 999);
    } else if (period === 'custom') {
      if (dateRange.start) startDate = new Date(dateRange.start);
      if (dateRange.end) {
        endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
      }
      const duration = endDate.getTime() - startDate.getTime();
      pStart = new Date(startDate.getTime() - duration);
      pEnd = new Date(endDate.getTime() - duration);
    }

    return {
      currentStart: startDate.toISOString(),
      currentEnd: endDate.toISOString(),
      prevStart: pStart.toISOString(),
      prevEnd: pEnd.toISOString()
    };
  }, [period, dateRange]);

  const [isExporting, setIsExporting] = useState(false);




  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await printReport({ activeTab, currentStart, currentEnd, prevStart, prevEnd, statusFilter, paymentFilter, searchQuery, qrCodeDataUrl, adminName });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = handleExportPDF;

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportExcelReport({ currentStart, currentEnd, prevStart, prevEnd, statusFilter, paymentFilter, searchQuery });
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير Excel');
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="reports-container pb-20" id="report-content">


      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[var(--gold)]">نظام التقارير المتقدم</h1>
          <p className="text-gray-400">تحليل المبيعات والطلبات بالاعتماد على خوادم البيانات</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportExcel} disabled={isExporting} className="btn-secondary flex items-center gap-2 bg-emerald-600/20 text-emerald-500 border-emerald-600/50 hover:bg-emerald-600/40">
            <FileSpreadsheet size={18} /> تصدير Excel
          </button>
          <button onClick={handleExportPDF} disabled={isExporting} className="btn-secondary flex items-center gap-2 bg-red-600/20 text-red-500 border-red-600/50 hover:bg-red-600/40">
            <Download size={18} /> {isExporting ? 'جاري إعداد التقرير...' : 'تصدير PDF'}
          </button>
          <button onClick={handlePrint} disabled={isExporting} className="btn-primary flex items-center gap-2">
            <Printer size={18} /> {isExporting ? 'جاري إعداد التقرير...' : 'طباعة التقرير'}
          </button>
        </div>
      </div>

      {/* Main Filters Area */}
      <div className="glass-panel p-5 mb-8 print:hidden">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--gold)]"><Filter size={20}/> إعدادات التقرير والفلاتر</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-2">الفترة الزمنية</label>
            <select 
              className="input-field w-full"
              value={period} 
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            >
              <option value="today">اليوم</option>
              <option value="this_week">هذا الأسبوع</option>
              <option value="this_month">هذا الشهر</option>
              <option value="custom">فترة مخصصة</option>
            </select>
          </div>

          {period === 'custom' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">من تاريخ</label>
                <input type="date" className="input-field w-full" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">إلى تاريخ</label>
                <input type="date" className="input-field w-full" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">حالة الطلب</label>
            <select className="input-field w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">الكل</option>
              <option value="delivered">مكتمل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">طريقة الدفع</label>
            <select className="input-field w-full" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">الكل</option>
              <option value="cash">نقدي</option>
              <option value="transfer">تحويل</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">بحث (اسم، هاتف، رقم...)</label>
            <input 
              type="text" 
              className="input-field w-full" 
              placeholder="ابحث هنا..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-8 border-b border-[var(--border)] pb-2 scrollbar-hide print:hidden">
        {[
          { id: 'dashboard', label: 'لوحة القيادة', icon: Activity },
          { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
          { id: 'products', label: 'الأطباق والأصناف', icon: Box },
          { id: 'customers', label: 'العملاء', icon: Users },
          { id: 'summary', label: 'مقارنة ونمو المبيعات', icon: TrendingUp },
          { id: 'offers', label: 'العروض والباقات', icon: Tag },
          { id: 'invoices', label: 'فواتير الزبائن', icon: Printer },
          { id: 'audit', label: 'سجلات التدقيق', icon: Activity },
          { id: 'delivery', label: 'تحليلات التوصيل', icon: Truck },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id 
                ? 'bg-[var(--gold-faint)] text-[var(--gold)] font-bold border-b-2 border-[var(--gold)]' 
                : 'text-gray-400 hover:bg-[var(--border)]'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <div className={`${activeTab === 'dashboard' ? 'block print:block' : 'hidden print:hidden'} print:break-inside-avoid print:mb-10`}>
          {activeTab === 'dashboard' && <h2 className="hidden print:block text-2xl font-bold mb-4 text-[#d4af37] border-b pb-2">لوحة القيادة</h2>}
          <DashboardTab startDate={currentStart} endDate={currentEnd} status={statusFilter} payment={paymentFilter} search={searchQuery} />
        </div>
        
        <div className={`${activeTab === 'summary' ? 'block' : 'hidden'} ${activeTab === 'dashboard' || activeTab === 'summary' ? 'print:block' : 'print:hidden'} print:break-inside-avoid print:mb-10`}>
          {activeTab === 'dashboard' && <h2 className="hidden print:block text-2xl font-bold mt-8 mb-4 text-[#d4af37] border-b pb-2">مقارنة ونمو المبيعات</h2>}
          <SummaryTab currentStart={currentStart} currentEnd={currentEnd} prevStart={prevStart} prevEnd={prevEnd} status={statusFilter} payment={paymentFilter} search={searchQuery} />
        </div>
        
        <div className={`${activeTab === 'orders' ? 'block' : 'hidden'} ${activeTab === 'dashboard' || activeTab === 'orders' ? 'print:block' : 'print:hidden'} print:break-inside-avoid print:mb-10`}>
          {activeTab === 'dashboard' && <h2 className="hidden print:block text-2xl font-bold mt-8 mb-4 text-[#d4af37] border-b pb-2">سجل الطلبات</h2>}
          <OrdersTab startDate={currentStart} endDate={currentEnd} status={statusFilter} payment={paymentFilter} search={searchQuery} />
        </div>
        
        <div className={`${activeTab === 'products' ? 'block' : 'hidden'} ${activeTab === 'dashboard' || activeTab === 'products' ? 'print:block' : 'print:hidden'} print:break-inside-avoid print:mb-10`}>
          {activeTab === 'dashboard' && <h2 className="hidden print:block text-2xl font-bold mt-8 mb-4 text-[#d4af37] border-b pb-2">تحليل الأطباق والأصناف</h2>}
          <ProductsTab startDate={currentStart} endDate={currentEnd} status={statusFilter} payment={paymentFilter} search={searchQuery} />
        </div>
        
        <div className={`${activeTab === 'customers' ? 'block' : 'hidden'} ${activeTab === 'dashboard' || activeTab === 'customers' ? 'print:block' : 'print:hidden'} print:break-inside-avoid print:mb-10`}>
          {activeTab === 'dashboard' && <h2 className="hidden print:block text-2xl font-bold mt-8 mb-4 text-[#d4af37] border-b pb-2">تحليل العملاء</h2>}
          <CustomersTab startDate={currentStart} endDate={currentEnd} status={statusFilter} payment={paymentFilter} search={searchQuery} />
        </div>

        <div className={`${activeTab === 'offers' ? 'block' : 'hidden'} print:break-inside-avoid print:mb-10`}>
          <OffersTab startDate={currentStart} endDate={currentEnd} status={statusFilter} payment={paymentFilter} search={searchQuery} />
        </div>

        <div className={`${activeTab === 'invoices' ? 'block' : 'hidden'} print:break-inside-avoid print:mb-10`}>
          <InvoicesTab startDate={currentStart} endDate={currentEnd} status={statusFilter} payment={paymentFilter} search={searchQuery} />
        </div>

        <div className={`${activeTab === 'audit' ? 'block' : 'hidden'} print:break-inside-avoid print:mb-10`}>
          <AuditLogsTab startDate={currentStart} endDate={currentEnd} status={statusFilter} payment={paymentFilter} search={searchQuery} />
        </div>

        <div className={`${activeTab === 'delivery' ? 'block' : 'hidden'} print:break-inside-avoid print:mb-10`}>
          <DeliveryAnalyticsTab startDate={currentStart} endDate={currentEnd} status={statusFilter} payment={paymentFilter} search={searchQuery} />
        </div>
      </div>

      {/* Print Footer (Repeats at the bottom of every printed page) */}
      <div className="hidden print:flex flex-row justify-between items-center w-full border-t border-gray-300 pt-2 text-[10px] text-gray-500" style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} dir="rtl">
        <span>تقرير أداء تلقائي - مطعم بيت المندي</span>
        <span>الرمز الأمني للتحقق: 87BA9A7C5F3A</span>
      </div>
    </div>
  );
}
