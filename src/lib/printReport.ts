export type ReportTab = 'dashboard' | 'orders' | 'products' | 'customers' | 'summary';

interface PrintReportOptions {
  activeTab: ReportTab;
  currentStart: string;
  currentEnd: string;
  prevStart: string;
  prevEnd: string;
  statusFilter: string;
  paymentFilter: string;
  searchQuery: string;
  qrCodeDataUrl: string;
}

async function fetchData(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function statusLabel(s: string) {
  if (s === 'delivered') return 'مكتمل';
  if (s === 'pending') return 'قيد الانتظار';
  if (s === 'cancelled') return 'ملغي';
  if (s === 'preparing') return 'قيد التحضير';
  return s;
}

function paymentLabel(p: string) {
  if (p === 'cash') return 'نقداً';
  if (p === 'transfer') return 'تحويل';
  if (p === 'wallet') return 'محفظة';
  return p;
}

function periodLabel(tab: ReportTab) {
  if (tab === 'dashboard') return 'التقرير الشامل والأداء العام';
  if (tab === 'orders') return 'تقرير سجل الطلبات المفصل';
  if (tab === 'products') return 'تقرير تحليل الأطباق والأصناف';
  if (tab === 'customers') return 'تقرير تحليل العملاء';
  if (tab === 'summary') return 'تقرير مقارنة ونمو المبيعات';
  return 'تقرير';
}

function buildStyles() {
  return `
    @page { size: A4; margin: 15mm 10mm 20mm 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', 'Tahoma', Arial, sans-serif; direction: rtl; background: #fff; color: #111; font-size: 13px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px; }
    .page-header .brand { display: flex; align-items: center; gap: 14px; }
    .page-header .brand img { width: 72px; height: 72px; border-radius: 50%; border: 2px solid #d4af37; object-fit: cover; }
    .page-header .brand h1 { font-size: 22px; font-weight: 900; color: #74133a; margin-bottom: 4px; }
    .page-header .brand p { font-size: 14px; font-weight: 700; color: #d4af37; }
    .page-header .meta { text-align: right; font-size: 11px; line-height: 1.8; color: #444; }
    .page-header .meta b { color: #111; }
    .page-header .qr img { width: 72px; height: 72px; border: 1px solid #ccc; padding: 4px; background: #fff; }
    .page-header .qr p { font-size: 9px; text-align: center; color: #888; margin-top: 3px; }
    .section-title { font-size: 17px; font-weight: 800; color: #74133a; border-right: 4px solid #d4af37; padding-right: 10px; margin: 24px 0 14px 0; page-break-after: avoid; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; text-align: center; }
    .kpi-box .label { font-size: 11px; color: #6b7280; margin-bottom: 6px; }
    .kpi-box .value { font-size: 20px; font-weight: 900; color: #74133a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    th { background: #f3f0ea; color: #3a2318; font-weight: 800; padding: 8px 10px; border: 1px solid #d1c9b8; text-align: right; }
    td { padding: 7px 10px; border: 1px solid #e5e0d5; color: #222; }
    tr:nth-child(even) td { background: #faf8f5; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
    .badge-delivered { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
    .page-footer { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding: 4px 10px; background: #fff; }
    .page-break { page-break-before: always; }
    .growth-positive { color: #059669; font-weight: 700; }
    .growth-negative { color: #dc2626; font-weight: 700; }
    h2.no-print { display: none; }
  `;
}

function buildHeader(options: PrintReportOptions) {
  const { activeTab, currentStart, currentEnd, qrCodeDataUrl } = options;
  const startFmt = new Date(currentStart).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const endFmt = new Date(currentEnd).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const nowFmt = new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
  return `
    <div class="page-header">
      <div class="brand">
        <img src="/logo.jpg" alt="بيت المندي" onerror="this.style.display='none'" />
        <div>
          <h1>مطعم بيت المندي</h1>
          <p>${periodLabel(activeTab)}</p>
        </div>
      </div>
      <div class="meta">
        <div><b>الفترة الزمنية:</b> ${startFmt} — ${endFmt}</div>
        <div><b>المسؤول:</b> مدير النظام</div>
        <div><b>تاريخ الإصدار:</b> ${nowFmt}</div>
        <div><b>الحالة:</b> ${options.statusFilter === 'all' ? 'جميع الحالات' : statusLabel(options.statusFilter)}</div>
        <div><b>الدفع:</b> ${options.paymentFilter === 'all' ? 'جميع الطرق' : paymentLabel(options.paymentFilter)}</div>
        ${options.searchQuery ? `<div><b>بحث:</b> ${options.searchQuery}</div>` : ''}
      </div>
      <div class="qr">
        ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR" />` : ''}
        <p>مسح للتحقق</p>
      </div>
    </div>
  `;
}

function buildFooter() {
  return `<div class="page-footer"><span>تقرير أداء تلقائي — مطعم بيت المندي</span><span>الرمز الأمني: 87BA9A7C5F3A</span></div>`;
}

function buildDashboardSection(data: any) {
  if (!data) return '<p>لا توجد بيانات</p>';
  const lastOrders = (data.lastOrders || []).slice(0, 10);
  return `
    <div class="kpi-grid">
      <div class="kpi-box"><div class="label">مبيعات الفترة</div><div class="value">${Number(data.todaySales || 0).toLocaleString('ar-EG')} ﷼</div></div>
      <div class="kpi-box"><div class="label">عدد الطلبات</div><div class="value">${data.todayOrders || 0}</div></div>
      <div class="kpi-box"><div class="label">الطلبات النشطة</div><div class="value">${data.activeOrders || 0}</div></div>
    </div>
    <h2 class="section-title">آخر الطلبات</h2>
    <table>
      <thead><tr><th>رقم الطلب</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>الوقت</th></tr></thead>
      <tbody>
        ${lastOrders.map((o: any) => `
          <tr>
            <td>${o.orderNumber}</td>
            <td>${o.customerName}</td>
            <td>${Number(o.totalAmount).toLocaleString('ar-EG')} ﷼</td>
            <td><span class="badge badge-${o.status}">${statusLabel(o.status)}</span></td>
            <td>${new Date(o.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        `).join('')}
        ${lastOrders.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">لا توجد طلبات في هذه الفترة</td></tr>' : ''}
      </tbody>
    </table>
  `;
}

function buildOrdersSection(data: any) {
  const orders = (data?.data || []);
  return `
    <table>
      <thead><tr><th>#</th><th>رقم الطلب</th><th>العميل</th><th>الهاتف</th><th>المبلغ</th><th>الحالة</th><th>الدفع</th><th>التاريخ</th></tr></thead>
      <tbody>
        ${orders.map((o: any, i: number) => `
          <tr>
            <td>${i + 1}</td>
            <td>${o.orderNumber}</td>
            <td>${o.customerName}</td>
            <td dir="ltr">${o.customerPhone}</td>
            <td>${Number(o.totalAmount).toLocaleString('ar-EG')} ﷼</td>
            <td><span class="badge badge-${o.status}">${statusLabel(o.status)}</span></td>
            <td>${paymentLabel(o.paymentMethod)}</td>
            <td>${new Date(o.createdAt).toLocaleDateString('ar-EG')}</td>
          </tr>
        `).join('')}
        ${orders.length === 0 ? '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">لا توجد طلبات</td></tr>' : ''}
      </tbody>
    </table>
    <p style="font-size:11px;color:#6b7280;margin-top:-12px;">إجمالي الطلبات المعروضة: ${orders.length}</p>
  `;
}

function buildProductsSection(data: any) {
  const top10 = (data?.top10Qty || []);
  const cats = (data?.categoriesSales || []);
  const unsold = (data?.unsold || []);
  return `
    <h2 class="section-title">أعلى 10 أطباق مبيعاً (بالكمية)</h2>
    <table>
      <thead><tr><th>#</th><th>اسم الطبق</th><th>التصنيف</th><th>الكمية</th><th>الإيرادات</th></tr></thead>
      <tbody>
        ${top10.map((p: any, i: number) => `<tr><td>${i+1}</td><td>${p.name}</td><td>${p.category || '-'}</td><td>${p.quantity}</td><td>${Number(p.revenue).toLocaleString('ar-EG')} ﷼</td></tr>`).join('')}
        ${top10.length === 0 ? '<tr><td colspan="5" style="text-align:center">لا توجد بيانات</td></tr>' : ''}
      </tbody>
    </table>
    <h2 class="section-title">مبيعات التصنيفات</h2>
    <table>
      <thead><tr><th>#</th><th>التصنيف</th><th>الكمية</th><th>الإيرادات</th><th>عدد الطلبات</th></tr></thead>
      <tbody>
        ${cats.map((c: any, i: number) => `<tr><td>${i+1}</td><td>${c.name}</td><td>${c.quantity}</td><td>${Number(c.revenue).toLocaleString('ar-EG')} ﷼</td><td>${c.ordersCount}</td></tr>`).join('')}
        ${cats.length === 0 ? '<tr><td colspan="5" style="text-align:center">لا توجد بيانات</td></tr>' : ''}
      </tbody>
    </table>
    ${unsold.length > 0 ? `
    <h2 class="section-title">الأطباق غير المطلوبة</h2>
    <table>
      <thead><tr><th>#</th><th>اسم الطبق</th></tr></thead>
      <tbody>${unsold.map((u: any, i: number) => `<tr><td>${i+1}</td><td>${u.name}</td></tr>`).join('')}</tbody>
    </table>` : ''}
  `;
}

function buildCustomersSection(data: any) {
  const customers = Array.isArray(data) ? data : [];
  return `
    <table>
      <thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>عدد الطلبات</th><th>إجمالي الإنفاق</th><th>متوسط الطلب</th><th>آخر طلب</th></tr></thead>
      <tbody>
        ${customers.map((c: any, i: number) => `
          <tr>
            <td>${i+1}</td>
            <td>${c.name}</td>
            <td dir="ltr">${c.phone}</td>
            <td>${c.ordersCount}</td>
            <td>${Number(c.spend).toLocaleString('ar-EG')} ﷼</td>
            <td>${Number(c.avgOrder).toFixed(0)} ﷼</td>
            <td>${new Date(c.lastOrder).toLocaleDateString('ar-EG')}</td>
          </tr>
        `).join('')}
        ${customers.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">لا توجد بيانات</td></tr>' : ''}
      </tbody>
    </table>
  `;
}

function buildSummarySection(data: any) {
  if (!data) return '<p>لا توجد بيانات</p>';
  const payments = (data.payments || []);
  return `
    <h2 class="section-title">مقارنة الفترات</h2>
    <table>
      <thead><tr><th>المؤشر</th><th>الفترة الحالية</th><th>الفترة السابقة</th><th>النمو</th></tr></thead>
      <tbody>
        <tr>
          <td>إجمالي المبيعات</td>
          <td>${Number(data.currentSummary?.sales || 0).toLocaleString('ar-EG')} ﷼</td>
          <td>${Number(data.previousSummary?.sales || 0).toLocaleString('ar-EG')} ﷼</td>
          <td class="${data.salesGrowth >= 0 ? 'growth-positive' : 'growth-negative'}">${data.salesGrowth > 0 ? '+' : ''}${Number(data.salesGrowth || 0).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>عدد الطلبات</td>
          <td>${Number(data.currentSummary?.count || 0)}</td>
          <td>${Number(data.previousSummary?.count || 0)}</td>
          <td class="${data.ordersGrowth >= 0 ? 'growth-positive' : 'growth-negative'}">${data.ordersGrowth > 0 ? '+' : ''}${Number(data.ordersGrowth || 0).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>متوسط قيمة الطلب</td>
          <td>${Number(data.currentSummary?.avgOrder || 0).toFixed(2)} ﷼</td>
          <td>${Number(data.previousSummary?.avgOrder || 0).toFixed(2)} ﷼</td>
          <td class="${data.avgOrderGrowth >= 0 ? 'growth-positive' : 'growth-negative'}">${data.avgOrderGrowth > 0 ? '+' : ''}${Number(data.avgOrderGrowth || 0).toFixed(1)}%</td>
        </tr>
      </tbody>
    </table>
    <h2 class="section-title">توزيع طرق الدفع</h2>
    <table>
      <thead><tr><th>طريقة الدفع</th><th>المبيعات</th></tr></thead>
      <tbody>
        ${payments.map((p: any) => `<tr><td>${paymentLabel(p.method)}</td><td>${Number(p.sales).toLocaleString('ar-EG')} ﷼</td></tr>`).join('')}
        ${payments.length === 0 ? '<tr><td colspan="2" style="text-align:center">لا توجد بيانات</td></tr>' : ''}
      </tbody>
    </table>
  `;
}

export async function printReport(options: PrintReportOptions) {
  const { activeTab, currentStart, currentEnd, prevStart, prevEnd, statusFilter, paymentFilter, searchQuery } = options;

  const qs = `startDate=${currentStart}&endDate=${currentEnd}&status=${statusFilter}&payment=${paymentFilter}&search=${encodeURIComponent(searchQuery)}`;

  // Decide which data to fetch based on tab
  let dashData: any = null;
  let ordersData: any = null;
  let productsData: any = null;
  let customersData: any = null;
  let summaryData: any = null;

  if (activeTab === 'dashboard') {
    [dashData, ordersData, productsData, customersData, summaryData] = await Promise.all([
      fetchData(`/api/reports/dashboard?${qs}`),
      fetchData(`/api/reports/orders?${qs}&limit=50`),
      fetchData(`/api/reports/products?${qs}`),
      fetchData(`/api/reports/customers?${qs}`),
      fetchData(`/api/reports/compare?currStart=${currentStart}&currEnd=${currentEnd}&prevStart=${prevStart}&prevEnd=${prevEnd}&status=${statusFilter}&payment=${paymentFilter}&search=${encodeURIComponent(searchQuery)}`),
    ]);
  } else if (activeTab === 'orders') {
    ordersData = await fetchData(`/api/reports/orders?${qs}&limit=200`);
  } else if (activeTab === 'products') {
    productsData = await fetchData(`/api/reports/products?${qs}`);
  } else if (activeTab === 'customers') {
    customersData = await fetchData(`/api/reports/customers?${qs}`);
  } else if (activeTab === 'summary') {
    summaryData = await fetchData(`/api/reports/compare?currStart=${currentStart}&currEnd=${currentEnd}&prevStart=${prevStart}&prevEnd=${prevEnd}&status=${statusFilter}&payment=${paymentFilter}&search=${encodeURIComponent(searchQuery)}`);
  }

  // Build HTML body
  let body = buildHeader(options);

  if (activeTab === 'dashboard') {
    body += `<h2 class="section-title">لوحة القيادة — الأداء العام</h2>`;
    body += buildDashboardSection(dashData);
    body += `<div class="page-break"></div>`;
    body += buildHeader(options);
    body += `<h2 class="section-title">سجل الطلبات</h2>`;
    body += buildOrdersSection(ordersData);
    body += `<div class="page-break"></div>`;
    body += buildHeader(options);
    body += `<h2 class="section-title">تحليل الأطباق والأصناف</h2>`;
    body += buildProductsSection(productsData);
    body += `<div class="page-break"></div>`;
    body += buildHeader(options);
    body += `<h2 class="section-title">تحليل العملاء</h2>`;
    body += buildCustomersSection(customersData);
    body += `<div class="page-break"></div>`;
    body += buildHeader(options);
    body += `<h2 class="section-title">مقارنة ونمو المبيعات</h2>`;
    body += buildSummarySection(summaryData);
  } else if (activeTab === 'orders') {
    body += `<h2 class="section-title">سجل الطلبات التفصيلي</h2>`;
    body += buildOrdersSection(ordersData);
  } else if (activeTab === 'products') {
    body += buildProductsSection(productsData);
  } else if (activeTab === 'customers') {
    body += `<h2 class="section-title">تحليل العملاء</h2>`;
    body += buildCustomersSection(customersData);
  } else if (activeTab === 'summary') {
    body += buildSummarySection(summaryData);
  }

  body += buildFooter();

  // Open print window
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('يرجى السماح بفتح نوافذ منبثقة لاستخدام الطباعة');
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${periodLabel(activeTab)} — مطعم بيت المندي</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  <style>${buildStyles()}</style>
</head>
<body>${body}</body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  // Wait for images and fonts to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 800);
  };
}
