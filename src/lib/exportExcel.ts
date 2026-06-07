import ExcelJS from 'exceljs';

// ── Color palette ─────────────────────────────
const GOLD      = 'FFD4AF37';
const DARK_GOLD = 'FFB88645';
const PLUM      = 'FF74133A';
const WHITE     = 'FFFFFFFF';
const LIGHT_ROW = 'FFFFF8F0';
const BROWN_TXT = 'FF3A2318';

export function xlStatus(s: string) {
  return ({ delivered: 'مكتمل', pending: 'قيد الانتظار', cancelled: 'ملغي', preparing: 'قيد التحضير' } as any)[s] ?? s;
}
export function xlPayment(p: string) {
  return ({ cash: 'نقداً', transfer: 'تحويل', wallet: 'محفظة' } as any)[p] ?? p;
}

// Branded header — rows 1,2,3 then a blank row 4
function addHeader(ws: ExcelJS.Worksheet, title: string, cols: number, opts: { startFmt: string; endFmt: string; nowFmt: string; statusTxt: string; payTxt: string; search: string }) {
  // Row 1 – restaurant name
  ws.mergeCells(1, 1, 1, cols);
  const r1c1 = ws.getCell('A1');
  r1c1.value     = 'مطعم بيت المندي';
  r1c1.font      = { bold: true, size: 18, color: { argb: WHITE } };
  r1c1.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: PLUM } };
  r1c1.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rightToLeft' };
  ws.getRow(1).height = 36;

  // Row 2 – report title
  ws.mergeCells(2, 1, 2, cols);
  const r2c1 = ws.getCell('A2');
  r2c1.value     = title;
  r2c1.font      = { bold: true, size: 13, color: { argb: BROWN_TXT } };
  r2c1.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
  r2c1.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rightToLeft' };
  ws.getRow(2).height = 26;

  // Row 3 – metadata
  ws.mergeCells(3, 1, 3, cols);
  const r3c1 = ws.getCell('A3');
  r3c1.value =
    `الفترة: ${opts.startFmt} — ${opts.endFmt}  |  المسؤول: مدير النظام  |  ${opts.nowFmt}  |  الحالة: ${opts.statusTxt}  |  الدفع: ${opts.payTxt}` +
    (opts.search ? `  |  بحث: ${opts.search}` : '');
  r3c1.font      = { size: 10, color: { argb: WHITE }, italic: true };
  r3c1.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_GOLD } };
  r3c1.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rightToLeft', wrapText: true };
  ws.getRow(3).height = 22;

  // Row 4 – spacer
  ws.getRow(4).height = 8;
}

// Style a row as column-header (plum background, white bold text)
function styleColHdrRow(ws: ExcelJS.Worksheet, rowNum: number, colCount: number) {
  const row = ws.getRow(rowNum);
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font      = { bold: true, size: 11, color: { argb: WHITE } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: PLUM } };
    cell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rightToLeft' };
    cell.border    = { bottom: { style: 'medium', color: { argb: GOLD } } };
  }
  row.height = 22;
}

// Stripe data rows with alternating colors
function stripeRows(ws: ExcelJS.Worksheet, fromRow: number, toRow: number, colCount: number) {
  for (let r = fromRow; r <= toRow; r++) {
    const row = ws.getRow(r);
    const bg  = (r - fromRow) % 2 === 0 ? WHITE : LIGHT_ROW;
    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rightToLeft' };
      cell.border    = { bottom: { style: 'thin', color: { argb: 'FFE5DFD5' } } };
      cell.font      = { size: 10 };
    }
    row.height = 18;
  }
}

// Add a colored divider row spanning all columns
function addDivider(ws: ExcelJS.Worksheet, label: string, colCount: number) {
  const nextRow = ws.rowCount + 1;
  ws.mergeCells(nextRow, 1, nextRow, colCount);
  const cell = ws.getCell(nextRow, 1);
  cell.value     = label;
  cell.font      = { bold: true, size: 12, color: { argb: WHITE } };
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_GOLD } };
  cell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rightToLeft' };
  ws.getRow(nextRow).height = 22;
  return nextRow;
}

// ─────────────────────────────────────────────
// Main export function
// ─────────────────────────────────────────────
export async function exportExcelReport(params: {
  currentStart:  string;
  currentEnd:    string;
  prevStart:     string;
  prevEnd:       string;
  statusFilter:  string;
  paymentFilter: string;
  searchQuery:   string;
}) {
  const { currentStart, currentEnd, prevStart, prevEnd, statusFilter, paymentFilter, searchQuery } = params;

  const startFmt  = new Date(currentStart).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const endFmt    = new Date(currentEnd).toLocaleDateString('ar-EG',   { year: 'numeric', month: 'long', day: 'numeric' });
  const nowFmt    = new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
  const statusTxt = statusFilter  === 'all' ? 'جميع الحالات' : xlStatus(statusFilter);
  const payTxt    = paymentFilter === 'all' ? 'جميع الطرق'  : xlPayment(paymentFilter);
  const hdrOpts   = { startFmt, endFmt, nowFmt, statusTxt, payTxt, search: searchQuery };

  const qs = `startDate=${currentStart}&endDate=${currentEnd}&status=${statusFilter}&payment=${paymentFilter}&search=${encodeURIComponent(searchQuery)}`;

  const [ordersRes, productsRes, customersRes, compareRes] = await Promise.all([
    fetch(`/api/reports/orders?${qs}&limit=1000`).then(r => r.json()),
    fetch(`/api/reports/products?${qs}`).then(r => r.json()),
    fetch(`/api/reports/customers?${qs}`).then(r => r.json()),
    fetch(`/api/reports/compare?currStart=${currentStart}&currEnd=${currentEnd}&prevStart=${prevStart}&prevEnd=${prevEnd}&status=${statusFilter}&payment=${paymentFilter}&search=${encodeURIComponent(searchQuery)}`).then(r => r.json()),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'مطعم بيت المندي';
  wb.created  = new Date();
  wb.modified = new Date();

  // ════════════════════════════════
  // Sheet 1: Orders
  // ════════════════════════════════
  const wsO = wb.addWorksheet('سجل الطلبات', { views: [{ rightToLeft: true }] });
  const oWidths = [6, 22, 22, 16, 16, 14, 14, 20];
  const oHdrs   = ['#', 'رقم الطلب', 'اسم العميل', 'رقم الهاتف', 'المبلغ (ريال)', 'الحالة', 'طريقة الدفع', 'التاريخ'];
  oWidths.forEach((w, i) => { wsO.getColumn(i + 1).width = w; });
  addHeader(wsO, 'تقرير سجل الطلبات المفصل', oHdrs.length, hdrOpts);
  wsO.getRow(5).values = oHdrs;
  styleColHdrRow(wsO, 5, oHdrs.length);

  const orders = ordersRes?.data ?? [];
  orders.forEach((o: any, i: number) => {
    wsO.addRow([i + 1, o.orderNumber, o.customerName, o.customerPhone, Number(o.totalAmount), xlStatus(o.status), xlPayment(o.paymentMethod), new Date(o.createdAt).toLocaleString('ar-EG')]);
  });
  stripeRows(wsO, 6, 5 + orders.length, oHdrs.length);

  const oTotal = wsO.addRow(['', `الإجمالي: ${orders.length} طلب`, '', '', orders.reduce((s: number, o: any) => s + Number(o.totalAmount), 0)]);
  oTotal.font = { bold: true, size: 11, color: { argb: PLUM } };
  oTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_ROW } };

  // ════════════════════════════════
  // Sheet 2: Products
  // ════════════════════════════════
  const wsP = wb.addWorksheet('الأطباق والأصناف', { views: [{ rightToLeft: true }] });
  const pWidths = [6, 34, 18, 16, 18];
  const pHdrs   = ['#', 'اسم الطبق', 'التصنيف', 'الكمية المباعة', 'الإيرادات (ريال)'];
  pWidths.forEach((w, i) => { wsP.getColumn(i + 1).width = w; });
  addHeader(wsP, 'تقرير تحليل الأطباق والأصناف', pHdrs.length, hdrOpts);
  wsP.getRow(5).values = pHdrs;
  styleColHdrRow(wsP, 5, pHdrs.length);

  const top10 = productsRes?.top10Qty ?? [];
  top10.forEach((p: any, i: number) => wsP.addRow([i + 1, p.name, p.category || '-', Number(p.quantity), Number(p.revenue)]));
  stripeRows(wsP, 6, 5 + top10.length, pHdrs.length);

  const cats = productsRes?.categoriesSales ?? [];
  if (cats.length > 0) {
    addDivider(wsP, 'مبيعات التصنيفات', pHdrs.length);
    const cH = wsP.addRow(['#', 'التصنيف', '', 'الكمية', 'الإيرادات (ريال)']);
    styleColHdrRow(wsP, cH.number, pHdrs.length);
    const cStart = wsP.rowCount + 1;
    cats.forEach((c: any, i: number) => wsP.addRow([i + 1, c.name, '', Number(c.quantity), Number(c.revenue)]));
    stripeRows(wsP, cStart, wsP.rowCount, pHdrs.length);
  }

  const unsold = productsRes?.unsold ?? [];
  if (unsold.length > 0) {
    addDivider(wsP, 'الأطباق غير المطلوبة', pHdrs.length);
    const uH = wsP.addRow(['#', 'اسم الطبق', '', '', '']);
    styleColHdrRow(wsP, uH.number, pHdrs.length);
    const uStart = wsP.rowCount + 1;
    unsold.forEach((u: any, i: number) => wsP.addRow([i + 1, u.name, '', '', '']));
    stripeRows(wsP, uStart, wsP.rowCount, pHdrs.length);
  }

  // ════════════════════════════════
  // Sheet 3: Customers
  // ════════════════════════════════
  const wsC = wb.addWorksheet('تحليل العملاء', { views: [{ rightToLeft: true }] });
  const cWidths = [6, 25, 16, 14, 20, 16, 18];
  const cHdrs   = ['#', 'اسم العميل', 'رقم الهاتف', 'عدد الطلبات', 'إجمالي الإنفاق (ريال)', 'متوسط الطلب', 'آخر طلب'];
  cWidths.forEach((w, i) => { wsC.getColumn(i + 1).width = w; });
  addHeader(wsC, 'تقرير تحليل العملاء', cHdrs.length, hdrOpts);
  wsC.getRow(5).values = cHdrs;
  styleColHdrRow(wsC, 5, cHdrs.length);

  const customers = Array.isArray(customersRes) ? customersRes : [];
  customers.forEach((c: any, i: number) => wsC.addRow([i + 1, c.name, c.phone, Number(c.ordersCount), Number(c.spend), Number(c.avgOrder).toFixed(0), new Date(c.lastOrder).toLocaleDateString('ar-EG')]));
  stripeRows(wsC, 6, 5 + customers.length, cHdrs.length);

  // ════════════════════════════════
  // Sheet 4: Sales Comparison
  // ════════════════════════════════
  const wsS = wb.addWorksheet('مقارنة المبيعات', { views: [{ rightToLeft: true }] });
  const sWidths = [28, 20, 20, 14];
  const sHdrs   = ['المؤشر', 'الفترة الحالية', 'الفترة السابقة', 'النمو %'];
  sWidths.forEach((w, i) => { wsS.getColumn(i + 1).width = w; });
  addHeader(wsS, 'تقرير مقارنة ونمو المبيعات', sHdrs.length, hdrOpts);
  wsS.getRow(5).values = sHdrs;
  styleColHdrRow(wsS, 5, sHdrs.length);

  const sg = Number(compareRes?.salesGrowth   ?? 0);
  const og = Number(compareRes?.ordersGrowth  ?? 0);
  const ag = Number(compareRes?.avgOrderGrowth ?? 0);
  const metrics = [
    ['إجمالي المبيعات (ريال)', Number(compareRes?.currentSummary?.sales    ?? 0).toFixed(2), Number(compareRes?.previousSummary?.sales    ?? 0).toFixed(2), `${sg > 0 ? '+' : ''}${sg.toFixed(1)}%`],
    ['عدد الطلبات',            Number(compareRes?.currentSummary?.count    ?? 0),             Number(compareRes?.previousSummary?.count    ?? 0),             `${og > 0 ? '+' : ''}${og.toFixed(1)}%`],
    ['متوسط قيمة الطلب',      Number(compareRes?.currentSummary?.avgOrder ?? 0).toFixed(2), Number(compareRes?.previousSummary?.avgOrder ?? 0).toFixed(2), `${ag > 0 ? '+' : ''}${ag.toFixed(1)}%`],
  ];
  metrics.forEach(m => wsS.addRow(m));
  stripeRows(wsS, 6, 8, sHdrs.length);

  // Color the growth column
  [6, 7, 8].forEach(r => {
    const cell = wsS.getRow(r).getCell(4);
    const val  = String(cell.value ?? '');
    cell.font  = { bold: true, size: 10, color: { argb: val.startsWith('+') ? 'FF059669' : 'FFDC2626' } };
  });

  const pays = compareRes?.payments ?? [];
  if (pays.length > 0) {
    addDivider(wsS, 'توزيع طرق الدفع', sHdrs.length);
    const ph = wsS.addRow(['طريقة الدفع', 'المبيعات (ريال)', '', '']);
    styleColHdrRow(wsS, ph.number, sHdrs.length);
    const pStart = wsS.rowCount + 1;
    pays.forEach((p: any) => wsS.addRow([xlPayment(p.method), Number(p.sales).toFixed(2), '', '']));
    stripeRows(wsS, pStart, wsS.rowCount, sHdrs.length);
  }

  // ── Download ──────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `BaitAlMandi_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
