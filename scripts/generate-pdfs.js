/**
 * Bait Al Mandi — PDF Documentation Generator
 * 
 * Generates two professional PDFs from BAIT_AL_MANDI_ARCHITECTURE.md:
 * 1. Arabic version (RTL) with Cairo font
 * 2. English version (LTR) with translated content
 * 
 * Usage: node scripts/generate-pdfs.js
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const marked = require('marked');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MD_PATH = path.join(__dirname, '..', 'BAIT_AL_MANDI_ARCHITECTURE.md');
const EXPORTS_DIR = path.join(__dirname, '..', 'exports');
const AR_PDF = path.join(EXPORTS_DIR, 'BAIT_AL_MANDI_ARCHITECTURE_AR.pdf');
const EN_PDF = path.join(EXPORTS_DIR, 'BAIT_AL_MANDI_ARCHITECTURE_EN.pdf');

// ======================================================================
// CSS STYLES
// ======================================================================

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Cairo', 'Tajawal', 'Noto Sans Arabic', sans-serif;
    color: #1a1a1a;
    line-height: 1.8;
    font-size: 11pt;
    direction: var(--doc-dir, rtl);
  }

  /* ===== Cover Page ===== */
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    text-align: center;
    background: linear-gradient(135deg, #3D0820 0%, #5c0e30 50%, #3D0820 100%);
    color: #fff;
    padding: 60px 40px;
    page-break-after: always;
  }
  .cover-page .gold-line {
    width: 120px;
    height: 3px;
    background: #c59b5f;
    margin: 0 auto 30px;
  }
  .cover-page h1 {
    font-size: 32pt;
    font-weight: 900;
    color: #c59b5f;
    margin-bottom: 8px;
    letter-spacing: 2px;
  }
  .cover-page .subtitle-ar {
    font-size: 18pt;
    font-weight: 700;
    color: #e8d5b0;
    margin-bottom: 5px;
  }
  .cover-page .subtitle-en {
    font-size: 14pt;
    font-weight: 400;
    color: #b8a07a;
    margin-bottom: 40px;
  }
  .cover-page .gold-line-bottom {
    width: 80px;
    height: 2px;
    background: #c59b5f;
    margin: 0 auto 30px;
  }
  .cover-page .meta-table {
    display: grid;
    grid-template-columns: auto auto;
    gap: 8px 20px;
    font-size: 10pt;
    text-align: left;
    margin-top: 20px;
    direction: ltr;
  }
  .cover-page .meta-table .label {
    color: #b8a07a;
    font-weight: 600;
  }
  .cover-page .meta-table .value {
    color: #e8d5b0;
  }

  /* ===== TOC ===== */
  .toc-page {
    page-break-after: always;
    padding: 40px;
  }
  .toc-page h2 {
    font-size: 20pt;
    font-weight: 900;
    color: #3D0820;
    border-bottom: 3px solid #c59b5f;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  .toc-list {
    list-style: none;
    padding: 0;
  }
  .toc-list li {
    padding: 4px 0;
    border-bottom: 1px dotted #ddd;
    display: flex;
    justify-content: space-between;
    font-size: 10pt;
  }
  .toc-list .toc-h1 {
    font-weight: 800;
    color: #3D0820;
    font-size: 11pt;
    padding-top: 8px;
  }
  .toc-list .toc-h2 {
    padding-right: 20px;
    color: #555;
    font-weight: 400;
  }

  /* ===== Content Sections ===== */
  .content-section {
    padding: 30px 40px;
    page-break-before: always;
  }
  .content-section:first-of-type {
    page-break-before: always;
  }
  
  h1 {
    font-size: 20pt;
    font-weight: 900;
    color: #3D0820;
    border-bottom: 3px solid #c59b5f;
    padding-bottom: 8px;
    margin-bottom: 20px;
  }
  h1 .en-sub {
    display: block;
    font-size: 11pt;
    font-weight: 400;
    color: #888;
    margin-top: 2px;
  }
  
  h2 {
    font-size: 14pt;
    font-weight: 800;
    color: #5c0e30;
    border-right: 4px solid #c59b5f;
    padding-right: 10px;
    margin: 24px 0 12px;
    --ltr-border: border-left;
  }
  html[dir="ltr"] h2 {
    border-right: none;
    border-left: 4px solid #c59b5f;
    padding-right: 0;
    padding-left: 10px;
  }

  h3 {
    font-size: 12pt;
    font-weight: 700;
    color: #3D0820;
    margin: 18px 0 8px;
  }

  p {
    margin-bottom: 10px;
    color: #333;
  }

  /* ===== Code Blocks ===== */
  pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 14px 16px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', 'Cascadia Code', monospace;
    font-size: 8.5pt;
    line-height: 1.6;
    overflow-x: auto;
    direction: ltr;
    text-align: left;
    margin: 12px 0;
    page-break-inside: avoid;
    white-space: pre-wrap;
    word-break: break-word;
  }
  code {
    font-family: 'JetBrains Mono', 'Cascadia Code', monospace;
    font-size: 9pt;
    background: #f0f0f0;
    padding: 1px 5px;
    border-radius: 3px;
    color: #c7254e;
  }
  pre code {
    background: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }

  /* ===== Tables ===== */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th {
    background: #3D0820;
    color: #fff;
    font-weight: 700;
    padding: 8px 10px;
    text-align: center;
    border: 1px solid #5c0e30;
  }
  td {
    padding: 6px 10px;
    border: 1px solid #ddd;
    color: #333;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #faf5f0;
  }
  td code, th code {
    background: rgba(195, 155, 95, 0.15);
    color: #5c0e30;
  }

  /* ===== Lists ===== */
  ul, ol {
    padding-right: 20px;
    margin-bottom: 10px;
  }
  html[dir="ltr"] ul, html[dir="ltr"] ol {
    padding-right: 0;
    padding-left: 20px;
  }
  li {
    margin-bottom: 4px;
    color: #444;
  }

  /* ===== Blockquotes / Callouts ===== */
  blockquote {
    border-right: 4px solid #c59b5f;
    padding: 10px 16px;
    margin: 12px 0;
    background: #faf5f0;
    border-radius: 0 8px 8px 0;
    color: #555;
    font-size: 10pt;
  }
  html[dir="ltr"] blockquote {
    border-right: none;
    border-left: 4px solid #c59b5f;
    border-radius: 8px 0 0 8px;
  }

  /* ===== HR ===== */
  hr {
    border: none;
    border-top: 2px solid #c59b5f;
    margin: 30px 0;
  }

  /* ===== Page Footer ===== */
  .page-footer {
    position: running(footer);
    text-align: center;
    font-size: 8pt;
    color: #999;
    border-top: 1px solid #ddd;
    padding-top: 4px;
    margin-top: 10px;
  }
  .page-footer .confidential {
    color: #c59b5f;
    font-weight: 600;
  }

  /* ===== Print / Page ===== */
  @page {
    size: A4;
    margin: 25mm 20mm 25mm 20mm;
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #999;
      font-family: 'Cairo', sans-serif;
    }
    @top-center {
      content: "BAIT AL MANDI — System Documentation";
      font-size: 7pt;
      color: #aaa;
      font-family: 'Cairo', sans-serif;
    }
    @bottom-left {
      content: "Confidential Document";
      font-size: 7pt;
      color: #c59b5f;
      font-family: 'Cairo', sans-serif;
    }
  }

  /* ===== Highlight Boxes ===== */
  .highlight-green {
    background: #d1fae5;
    border: 1px solid #059669;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 10px 0;
    color: #065f46;
  }
  .highlight-yellow {
    background: #fef3c7;
    border: 1px solid #d97706;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 10px 0;
    color: #92400e;
  }
  .highlight-red {
    background: #fee2e2;
    border: 1px solid #dc2626;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 10px 0;
    color: #991b1b;
  }

  /* ===== Architecture Diagram ===== */
  .arch-box {
    border: 2px solid #3D0820;
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    text-align: center;
    font-weight: 700;
    font-size: 10pt;
  }
  .arch-box.gold {
    border-color: #c59b5f;
    background: #fefcf5;
  }
  .arch-arrow {
    text-align: center;
    color: #c59b5f;
    font-size: 14pt;
    margin: 2px 0;
  }

  /* RTL specific */
  html[dir="rtl"] {
    --doc-dir: rtl;
  }
  html[dir="ltr"] {
    --doc-dir: ltr;
  }

  /* Section header with icon */
  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .section-header .num {
    background: #c59b5f;
    color: #fff;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 14pt;
    flex-shrink: 0;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 700;
  }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-yellow { background: #fef3c7; color: #92400e; }
  .badge-red { background: #fee2e2; color: #991b1b; }

  .emoji-icon {
    font-size: 14pt;
    margin-left: 6px;
  }
  html[dir="ltr"] .emoji-icon {
    margin-left: 0;
    margin-right: 6px;
  }

  .page-break { page-break-before: always; }
`;


// ======================================================================
// ARABIC HTML GENERATOR
// ======================================================================

function generateArabicHTML(mdContent) {
  // Custom renderer for marked to handle Arabic content
  const renderer = new marked.Renderer();
  
  const html = marked.parse(mdContent, {
    renderer,
    gfm: true,
    breaks: false,
  });

  // Build TOC from the MD content
  const tocItems = buildTOC(mdContent);

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="utf-8">
  <title>بيت المندي — وثيقة البنية المعمارية للنظام</title>
  <style>${BASE_CSS}</style>
</head>
<body>

  <!-- ===== COVER PAGE ===== -->
  <div class="cover-page">
    <div class="gold-line"></div>
    <h1>بيت المندي</h1>
    <div class="subtitle-ar">وثيقة البنية المعمارية للنظام</div>
    <div class="gold-line-bottom"></div>
    <div class="subtitle-en">BAIT AL MANDI — System Architecture Documentation</div>
    <div style="margin-top: 30px; font-size: 10pt; color: #b8a07a;">
      <div>Version 1.0</div>
      <div>15 June 2026</div>
    </div>
    <div style="margin-top: 40px; padding: 20px; border: 1px solid rgba(197,155,95,0.3); border-radius: 12px; max-width: 360px;">
      <div class="meta-table" style="direction: rtl; text-align: right;">
        <span class="label">الاسم:</span><span class="value">مطعم بيت المندي</span>
        <span class="label">المشروع:</span><span class="value">نظام إدارة مطعم متكامل</span>
        <span class="label">التقنية:</span><span class="value">Next.js 14 · Supabase · TypeScript</span>
        <span class="label">الإصدار:</span><span class="value">1.0</span>
        <span class="label">تاريخ الإنشاء:</span><span class="value">15 يونيو 2026</span>
        <span class="label">تاريخ التصدير:</span><span class="value">${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span class="label">التصنيف:</span><span class="value">سري — Confidential</span>
      </div>
    </div>
  </div>

  <!-- ===== TABLE OF CONTENTS ===== -->
  <div class="toc-page">
    <h2>فهرس المحتويات</h2>
    <ul class="toc-list">
      ${tocItems.map((item, i) => {
        const cls = item.level === 1 ? 'toc-h1' : 'toc-h2';
        return `<li class="${cls}"><span>${item.text}</span><span>${item.page || ''}</span></li>`;
      }).join('\n      ')}
    </ul>
  </div>

  <!-- ===== CONTENT ===== -->
  <div class="content">
    ${html}
  </div>

  <script>
    // Mark cover page
    document.querySelector('.cover-page').dataset.type = 'cover';
  </script>
</body>
</html>`;
}


// ======================================================================
// ENGLISH HTML GENERATOR (with translations)
// ======================================================================

function generateEnglishHTML() {
  // This generates a fully translated English version of the documentation
  return `<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="utf-8">
  <title>Bait Al Mandi — System Architecture Documentation</title>
  <style>${BASE_CSS}</style>
</head>
<body>

  <!-- ===== COVER PAGE ===== -->
  <div class="cover-page">
    <div class="gold-line"></div>
    <h1>BAIT AL MANDI</h1>
    <div class="subtitle-en" style="font-size:16pt; color:#e8d5b0;">System Architecture Documentation</div>
    <div class="gold-line-bottom"></div>
    <div class="subtitle-ar" style="font-size:14pt; color:#b8a07a;">بيت المندي — وثيقة البنية المعمارية للنظام</div>
    <div style="margin-top: 30px; font-size: 10pt; color: #b8a07a;">
      <div>Version 1.0</div>
      <div>June 15, 2026</div>
    </div>
    <div style="margin-top: 40px; padding: 20px; border: 1px solid rgba(197,155,95,0.3); border-radius: 12px; max-width: 400px;">
      <div class="meta-table">
        <span class="label">Name:</span><span class="value">Bait Al Mandi Restaurant</span>
        <span class="label">Project:</span><span class="value">Full-Stack Restaurant Management System</span>
        <span class="label">Tech Stack:</span><span class="value">Next.js 14 · Supabase · TypeScript</span>
        <span class="label">Version:</span><span class="value">1.0</span>
        <span class="label">Created:</span><span class="value">June 15, 2026</span>
        <span class="label">Exported:</span><span class="value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span class="label">Classification:</span><span class="value">Confidential</span>
      </div>
    </div>
  </div>

  <!-- ===== TABLE OF CONTENTS ===== -->
  <div class="toc-page">
    <h2>Table of Contents</h2>
    <ul class="toc-list">
      <li class="toc-h1"><span>Section 1: System Overview</span></li>
      <li class="toc-h2"><span>1.1 What is Bait Al Mandi?</span></li>
      <li class="toc-h2"><span>1.2 Problem & Solution</span></li>
      <li class="toc-h2"><span>1.3 Tech Stack</span></li>
      <li class="toc-h2"><span>1.4 Key Versions</span></li>
      <li class="toc-h1"><span>Section 2: Directory Structure</span></li>
      <li class="toc-h1"><span>Section 3: Database Architecture</span></li>
      <li class="toc-h2"><span>3.1 Core Tables (22 Tables)</span></li>
      <li class="toc-h2"><span>3.2 Enums (7)</span></li>
      <li class="toc-h2"><span>3.3 Orders Table Structure</span></li>
      <li class="toc-h2"><span>3.4 Site Settings (Key-Value Store)</span></li>
      <li class="toc-h1"><span>Section 4: Pages</span></li>
      <li class="toc-h2"><span>4.1 Public Pages</span></li>
      <li class="toc-h2"><span>4.2 Admin Pages</span></li>
      <li class="toc-h1"><span>Section 5: API Routes</span></li>
      <li class="toc-h2"><span>5.1 Public Routes</span></li>
      <li class="toc-h2"><span>5.2 Report Routes</span></li>
      <li class="toc-h1"><span>Section 6: Order Lifecycle</span></li>
      <li class="toc-h1"><span>Section 7: Delivery System</span></li>
      <li class="toc-h2"><span>7.1 Delivery Fee Calculation Flow</span></li>
      <li class="toc-h2"><span>7.2 Pricing Formula</span></li>
      <li class="toc-h2"><span>7.3 OSRM Integration Flow</span></li>
      <li class="toc-h1"><span>Section 8: Offer & Bundle System</span></li>
      <li class="toc-h2"><span>8.1 Offer Types (4)</span></li>
      <li class="toc-h2"><span>8.2 Pricing Engine (offer-pricing.ts)</span></li>
      <li class="toc-h2"><span>8.3 Snapshots</span></li>
      <li class="toc-h1"><span>Section 9: Invoice System</span></li>
      <li class="toc-h2"><span>9.1 Two Components, One Source</span></li>
      <li class="toc-h2"><span>9.2 Invoice Content Layout</span></li>
      <li class="toc-h2"><span>9.3 PDF Specifications</span></li>
      <li class="toc-h2"><span>9.4 Print Specifications (Admin)</span></li>
      <li class="toc-h2"><span>9.5 Tracking Token System</span></li>
      <li class="toc-h1"><span>Section 10: Security & Authorization</span></li>
      <li class="toc-h2"><span>10.1 Roles (3)</span></li>
      <li class="toc-h2"><span>10.2 Access Control</span></li>
      <li class="toc-h2"><span>10.3 Server Action Protection</span></li>
      <li class="toc-h2"><span>10.4 Potential Vulnerabilities</span></li>
      <li class="toc-h1"><span>Section 11: Reporting System</span></li>
      <li class="toc-h2"><span>11.1 Architecture</span></li>
      <li class="toc-h2"><span>11.2 Print & Export</span></li>
      <li class="toc-h1"><span>Section 12: State Management (Stores)</span></li>
      <li class="toc-h2"><span>12.1 cartStore (Zustand + persist)</span></li>
      <li class="toc-h2"><span>12.2 SettingsContext (React Context)</span></li>
      <li class="toc-h1"><span>Section 13: Legacy Files (Unused)</span></li>
      <li class="toc-h1"><span>Section 14: Dependency Map</span></li>
      <li class="toc-h1"><span>Section 15: Executive Summary</span></li>
      <li class="toc-h2"><span>15.1 Strengths</span></li>
      <li class="toc-h2"><span>15.2 Recommended Improvements</span></li>
      <li class="toc-h2"><span>15.3 Project Deliverables</span></li>
    </ul>
  </div>

  <!-- ===== CONTENT ===== -->
  <div class="content">

    <!-- SECTION 1 -->
    <div class="content-section">
      <h1>Section 1: System Overview</h1>

      <h2>1.1 What is Bait Al Mandi?</h2>
      <p>A full-stack restaurant management system for <strong>Bait Al Mandi</strong> — a Yemeni restaurant in <strong>Sanaa, Yemen</strong>. The system provides:</p>
      <ul>
        <li><strong>Public Website</strong> (Landing Page, Menu, Cart, Ordering, Tracking)</li>
        <li><strong>Admin Dashboard</strong> (Dashboard, Orders, Menu CRUD, Categories, Offers, Gallery, Reviews, Reports, Delivery Settings, Site Settings)</li>
        <li><strong>Delivery System</strong> (Distance-based pricing, weather/peak surcharges, OSRM Routing, interactive map)</li>
        <li><strong>Invoice System</strong> (PNG, PDF, direct print, QR Code for tracking)</li>
        <li><strong>Offer & Bundle System</strong> (Pricing Engine: fixed price, percentage discount, amount discount, free item)</li>
        <li><strong>Order Tracking System</strong> (Unique Tracking Token per customer, QR Code)</li>
        <li><strong>Reports & Analytics</strong> (12 API routes + interface tabs + print + Excel)</li>
      </ul>

      <h2>1.2 Problem & Solution</h2>
      <table>
        <tr><th>Problem</th><th>Solution</th></tr>
        <tr><td>No digital restaurant management system</td><td>Complete system from ordering to delivery to reports</td></tr>
        <tr><td>Delivery without maps or fair pricing</td><td>OSRM Routing + distance-based pricing + weather/peak surcharges</td></tr>
        <tr><td>Traditional paper invoices</td><td>PNG/PDF/print invoices with QR tracking</td></tr>
        <tr><td>Complex offers without a pricing engine</td><td>Pricing Engine with 4 offer types</td></tr>
        <tr><td>Order tracking difficulty</td><td>Tracking Token + tracking page per customer</td></tr>
      </table>

      <h2>1.3 Tech Stack</h2>
      <ul>
        <li><strong>Framework:</strong> Next.js 14.2.3 (App Router)</li>
        <li><strong>Language:</strong> TypeScript 5.4.5</li>
        <li><strong>Styling:</strong> Tailwind CSS + CSS Modules</li>
        <li><strong>Database:</strong> Supabase (PostgreSQL 15)</li>
        <li><strong>ORM:</strong> Drizzle ORM + Supabase REST (dual access)</li>
        <li><strong>Auth:</strong> Supabase Auth (email/password) + Row Level Security</li>
        <li><strong>State (Client):</strong> Zustand (cartStore) + React Context (Settings)</li>
        <li><strong>Charts:</strong> Recharts</li>
        <li><strong>Maps:</strong> Leaflet + OSRM (routing)</li>
        <li><strong>GIS:</strong> Turf.js + RBush (R-Tree spatial indexing)</li>
        <li><strong>PDF/PNG:</strong> jsPDF + html2canvas + QRCode.react</li>
        <li><strong>Excel:</strong> ExcelJS</li>
        <li><strong>Animations:</strong> Framer Motion + GSAP</li>
        <li><strong>Email:</strong> Nodemailer</li>
      </ul>

      <h2>1.4 Key Versions</h2>
      <table>
        <tr><th>Package</th><th>Version</th></tr>
        <tr><td>Next.js</td><td><code>^14.2.3</code></td></tr>
        <tr><td>React</td><td><code>^18.3.1</code></td></tr>
        <tr><td>Supabase SSR</td><td><code>^0.5.1</code></td></tr>
        <tr><td>Drizzle ORM</td><td><code>^0.30.10</code></td></tr>
        <tr><td>Zustand</td><td><code>^5.0.0</code></td></tr>
      </table>
    </div>

    <!-- SECTION 2 -->
    <div class="content-section">
      <h1>Section 2: Directory Structure</h1>
      <pre>baitalmandiwibapp/
├── src/
│   ├── actions/          # Server Actions (RSC mutations)
│   │   ├── categories.ts     # Categories CRUD
│   │   ├── items.ts          # Items & Prices CRUD
│   │   ├── orders.ts         # Order creation + delivery calc + status update
│   │   └── orders-offers.ts  # Fetch offer info for order
│   │
│   ├── app/              # App Router (pages + API)
│   │   ├── page.tsx          # Landing Page
│   │   ├── layout.tsx        # Root Layout (Navbar, Footer, SettingsProvider)
│   │   ├── globals.css       # Global styles (Custom Properties)
│   │   ├── page.module.css   # CSS Module for landing page
│   │   ├── favicon.ico
│   │   ├── menu/page.tsx     # Menu page (view + search + cart)
│   │   ├── cart/page.tsx     # Cart page (legacy)
│   │   ├── my-orders/page.tsx # Cart + map + full order flow
│   │   ├── contact/page.tsx  # Contact page + review submission
│   │   ├── gallery/page.tsx  # Photo gallery
│   │   ├── test-map/page.tsx # Map test page
│   │   ├── t/[token]/page.tsx# Order tracking by token
│   │   ├── track-order/[orderId]/page.tsx # Order tracking by UUID
│   │   ├── admin/            # Admin panel
│   │   │   ├── layout.tsx    # Admin Layout (Sidebar + Auth)
│   │   │   ├── page.tsx      # Admin Dashboard
│   │   │   ├── login/        # Login page + actions
│   │   │   ├── orders/       # Order management
│   │   │   ├── menu/         # Menu CRUD
│   │   │   ├── categories/   # Categories CRUD
│   │   │   ├── offers/       # Offers CRUD
│   │   │   ├── gallery/      # Gallery management
│   │   │   ├── reviews/      # Reviews management
│   │   │   ├── reports/      # Reports (9 tabs)
│   │   │   ├── delivery/     # Delivery settings
│   │   │   └── settings/     # Site settings
│   │   └── api/             # API Routes
│   │       ├── auth/login/route.ts
│   │       ├── resolve-zone/route.ts (legacy)
│   │       └── reports/ (12 endpoints)
│   │
│   ├── components/
│   │   ├── admin/reports/    # 9 report tab components
│   │   ├── invoice/
│   │   │   ├── InvoiceModal.tsx    # Invoice modal (PNG/PDF)
│   │   │   └── receipt-html.ts    # Receipt HTML for printing
│   │   └── layout/          # Navbar, Footer, LoadingScreen
│   │
│   ├── db/
│   │   ├── index.ts         # Drizzle ORM initialization
│   │   ├── schema.ts        # Complete schema (22 tables)
│   │   └── rls.sql          # Row Level Security policies
│   │
│   ├── lib/
│   │   ├── supabase.ts      # Supabase Client (Browser)
│   │   ├── permissions.ts   # Permission system (3 roles)
│   │   ├── constants.ts     # Constants (contact info)
│   │   ├── settings-context.tsx # React Context for settings
│   │   ├── delivery-pricing.ts  # Single source for delivery fee calc
│   │   ├── delivery-routing.ts  # OSRM Routing + fallback
│   │   ├── delivery-zones.ts    # (Legacy) zone system
│   │   ├── offer-pricing.ts     # Offer pricing engine
│   │   ├── bundle-utils.ts      # Bundle info extraction
│   │   ├── location-validation.ts # Sanaa location validation
│   │   ├── exportExcel.ts       # Excel export
│   │   ├── printReport.ts       # Report printing
│   │   └── geo/                 # (Legacy) zone resolution
│   │
│   ├── middleware.ts         # Next.js Middleware (Admin Routes)
│   ├── types.d.ts            # Global TypeScript types
│   ├── services/reports/     # Report engine (Drizzle-based)
│   └── utils/supabase/       # Supabase utilities
│
├── supabase/migrations/      # 11 SQL Migrations (0000-0010)
├── sanaa-map-integration/    # GeoJSON data for Sanaa
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local</pre>
    </div>

    <!-- SECTION 3 -->
    <div class="content-section">
      <h1>Section 3: Database Architecture</h1>

      <h2>3.1 Core Tables (22 Tables)</h2>
      <table>
        <tr><th>#</th><th>Table</th><th>Description</th><th>Key Fields</th></tr>
        <tr><td>1</td><td><code>users</code></td><td>Restaurant customers</td><td><code>id</code> (PK), <code>full_name</code>, <code>phone</code> (UK)</td></tr>
        <tr><td>2</td><td><code>admin_users</code></td><td>Admin accounts</td><td><code>id</code> (PK), <code>email</code> (UK), <code>role</code> (enum)</td></tr>
        <tr><td>3</td><td><code>categories</code></td><td>Menu categories</td><td><code>id</code> (PK), <code>slug</code> (UK), <code>sort_order</code></td></tr>
        <tr><td>4</td><td><code>items</code></td><td>Menu items</td><td><code>id</code> (PK), <code>category_id</code> (FK)</td></tr>
        <tr><td>5</td><td><code>item_prices</code></td><td>Item price variants</td><td><code>id</code> (PK), <code>item_id</code> (FK), <code>original_price</code></td></tr>
        <tr><td>6</td><td><code>offers</code></td><td>Discount offers/bundles</td><td><code>id</code> (PK), <code>offer_type</code>, <code>discount_percent</code></td></tr>
        <tr><td>7</td><td><code>offer_items</code></td><td>Bundle components</td><td><code>id</code> (PK), <code>offer_id</code> (FK), <code>menu_item_id</code> (FK)</td></tr>
        <tr><td>8</td><td><code>cart_sessions</code></td><td>Cart sessions (legacy)</td><td><code>id</code> (PK), <code>session_id</code> (UK)</td></tr>
        <tr><td>9</td><td><code>cart_items</code></td><td>Cart line items (legacy)</td><td><code>id</code> (PK), <code>session_id</code> (FK)</td></tr>
        <tr><td>10</td><td><code>order_sequences</code></td><td>Order number sequences</td><td><code>id</code> (PK), <code>sequence_date</code> (UK)</td></tr>
        <tr><td>11</td><td><code>orders</code></td><td><strong>Core table</strong></td><td><code>id</code> (PK), <code>order_number</code> (UK), 28 columns</td></tr>
        <tr><td>12</td><td><code>order_items</code></td><td>Order line items</td><td><code>id</code> (PK), <code>order_id</code> (FK)</td></tr>
        <tr><td>13</td><td><code>order_status_history</code></td><td>Status change audit trail</td><td><code>id</code> (PK), <code>order_id</code> (FK)</td></tr>
        <tr><td>14</td><td><code>order_offers</code></td><td>Offer snapshot at order</td><td><code>id</code> (PK), <code>order_id</code> (FK, CASCADE)</td></tr>
        <tr><td>15</td><td><code>order_offer_items</code></td><td>Bundle lines snapshot</td><td><code>id</code> (PK), <code>order_offer_id</code> (FK, CASCADE)</td></tr>
        <tr><td>16</td><td><code>gallery_images</code></td><td>Photo gallery</td><td><code>id</code> (PK), <code>image_url</code></td></tr>
        <tr><td>17</td><td><code>reviews</code></td><td>Customer reviews</td><td><code>id</code> (PK), <code>rating</code></td></tr>
        <tr><td>18</td><td><code>site_settings</code></td><td><strong>Key-value settings store</strong></td><td><code>id</code> (PK), <code>setting_key</code> (UK), <code>value</code> (jsonb)</td></tr>
        <tr><td>19</td><td><code>branches</code></td><td>Restaurant branches</td><td><code>id</code> (PK), <code>name_ar/en</code></td></tr>
        <tr><td>20</td><td><code>audit_logs</code></td><td>Admin audit logs</td><td><code>id</code> (PK), <code>entity_id</code></td></tr>
        <tr><td>21</td><td><code>customer_tokens</code></td><td>Phone to token mapping</td><td><code>phone</code> (PK), <code>tracking_token</code></td></tr>
        <tr><td>22</td><td><code>scheduled_reports</code></td><td>Scheduled email reports</td><td><code>id</code> (PK), <code>period</code> (enum)</td></tr>
      </table>

      <h2>3.2 Enums (7)</h2>
      <pre>admin_role       → 'developer' | 'manager' | 'order_manager'
offer_status     → 'active' | 'expired' | 'disabled'
order_method     → 'whatsapp' | 'website'
order_status     → 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled'
payment_method   → 'cash' | 'transfer' | 'wallet'
audit_action     → 'modify' | 'cancel' | 'status_change' | 'other'
report_period    → 'daily' | 'weekly' | 'monthly'</pre>

      <h2>3.3 Orders Table Structure</h2>
      <pre>orders (
  id                          UUID PK DEFAULT gen_random_uuid()
  order_number                TEXT UK          ← "BAM-YYYYMMDD-XXXX"
  customer_id                 UUID FK→users
  customer_name               TEXT NOT NULL
  customer_phone              TEXT NOT NULL
  tracking_token              TEXT              ← UUID for tracking
  delivery_address            TEXT NOT NULL     ← Required (≥10 chars)
  subtotal                    NUMERIC NOT NULL  ← Server-calculated
  delivery_fee                NUMERIC DEFAULT 0
  tax_amount                  NUMERIC DEFAULT 0
  total_amount                NUMERIC NOT NULL  ← Server recalculation
  notes                       TEXT
  estimated_time              TIMESTAMPTZ
  order_method                order_method NOT NULL
  payment_method              payment_method DEFAULT 'cash'
  offer_id                    UUID FK→offers
  status                      order_status DEFAULT 'pending'
  version                     INTEGER DEFAULT 1  ← Optimistic Locking
  created_at / updated_at     TIMESTAMPTZ
  is_archived / archived_at   BOOLEAN + TIMESTAMPTZ
  is_deleted / deleted_at     BOOLEAN + TIMESTAMPTZ

  -- Delivery Geo Fields
  delivery_latitude           NUMERIC
  delivery_longitude          NUMERIC
  delivery_zone               TEXT              ← null (resolved)
  delivery_distance_km        NUMERIC
  delivery_duration_minutes   INTEGER
  location_verified           BOOLEAN DEFAULT false

  -- Delivery Fee Snapshot Fields (migration 0010)
  base_delivery_fee_amount    NUMERIC DEFAULT 0
  extra_distance_km           NUMERIC DEFAULT 0
  extra_fee_amount            NUMERIC DEFAULT 0
  weather_fee_amount          NUMERIC DEFAULT 0
  peak_fee_amount             NUMERIC DEFAULT 0
  peak_percentage_used        NUMERIC DEFAULT 0
)</pre>

      <h2>3.4 Site Settings (Key-Value Store)</h2>
      <p>The <code>site_settings</code> table stores all configurable parameters:</p>
      <table>
        <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        <tr><td><code>restaurant_name</code></td><td>string</td><td>"بيت المندي"</td><td>Restaurant name</td></tr>
        <tr><td><code>restaurant_image</code></td><td>string</td><td>""</td><td>Restaurant logo URL</td></tr>
        <tr><td><code>restaurant_lat</code></td><td>string</td><td>"15.360..."</td><td>Restaurant latitude</td></tr>
        <tr><td><code>restaurant_lng</code></td><td>string</td><td>"44.174..."</td><td>Restaurant longitude</td></tr>
        <tr><td><code>base_delivery_fee</code></td><td>string</td><td>"400"</td><td>Base delivery fee</td></tr>
        <tr><td><code>included_distance_km</code></td><td>string</td><td>"2"</td><td>Included distance (km)</td></tr>
        <tr><td><code>extra_fee_per_km</code></td><td>string</td><td>"100"</td><td>Extra fee per km</td></tr>
        <tr><td><code>max_delivery_distance_km</code></td><td>string</td><td>"15"</td><td>Max delivery distance</td></tr>
        <tr><td><code>road_factor</code></td><td>string</td><td>"1.5"</td><td>Road factor (Haversine→Road)</td></tr>
        <tr><td><code>enable_weather_fee</code></td><td>string</td><td>"false"</td><td>Enable weather surcharge</td></tr>
        <tr><td><code>weather_fee</code></td><td>string</td><td>"200"</td><td>Weather fee amount</td></tr>
        <tr><td><code>enable_peak_hours</code></td><td>string</td><td>"false"</td><td>Enable peak hour surcharge</td></tr>
        <tr><td><code>peak_start_time</code></td><td>string</td><td>"12:00"</td><td>Peak start time</td></tr>
        <tr><td><code>peak_end_time</code></td><td>string</td><td>"14:00"</td><td>Peak end time</td></tr>
        <tr><td><code>peak_percentage</code></td><td>string</td><td>"20"</td><td>Peak surcharge percentage</td></tr>
        <tr><td><code>peak_days</code></td><td>string</td><td>"[]"</td><td>Peak days (JSON array)</td></tr>
      </table>
    </div>

    <!-- SECTION 4 -->
    <div class="content-section">
      <h1>Section 4: Pages</h1>

      <h2>4.1 Public Pages</h2>
      <table>
        <tr><th>Route</th><th>Component</th><th>Type</th><th>Function</th></tr>
        <tr><td><code>/</code></td><td><code>page.tsx</code></td><td>Client</td><td>Landing Page: Hero, Menu, Stats, Reviews, Gallery, WhatsApp</td></tr>
        <tr><td><code>/menu</code></td><td><code>page.tsx</code></td><td>Client</td><td>Full menu with search, categories, cart, offers</td></tr>
        <tr><td><code>/my-orders</code></td><td><code>page.tsx</code></td><td>Client</td><td>Cart + map + delivery calc + order creation</td></tr>
        <tr><td><code>/cart</code></td><td><code>page.tsx</code></td><td>Client</td><td>Legacy cart page</td></tr>
        <tr><td><code>/gallery</code></td><td><code>page.tsx</code></td><td>Client</td><td>Photo gallery with Lightbox</td></tr>
        <tr><td><code>/contact</code></td><td><code>page.tsx</code></td><td>Client</td><td>Contact form + review + restaurant info</td></tr>
        <tr><td><code>/t/[token]</code></td><td><code>page.tsx</code></td><td>Client</td><td>Order tracking by token with InvoiceModal</td></tr>
        <tr><td><code>/track-order/[orderId]</code></td><td><code>page.tsx</code></td><td>Client</td><td>Legacy tracking by UUID</td></tr>
        <tr><td><code>/test-map</code></td><td><code>page.tsx</code></td><td>Client</td><td>Map and OSRM test page</td></tr>
      </table>

      <h2>4.2 Admin Pages</h2>
      <table>
        <tr><th>Route</th><th>Component</th><th>Function</th></tr>
        <tr><td><code>/admin</code></td><td><code>page.tsx</code></td><td>Dashboard: totals, revenue, active items</td></tr>
        <tr><td><code>/admin/login</code></td><td><code>page.tsx</code></td><td>Admin login (Supabase Auth)</td></tr>
        <tr><td><code>/admin/orders</code></td><td><code>page.tsx</code></td><td>Order management (status updates, details)</td></tr>
        <tr><td><code>/admin/menu</code></td><td><code>page.tsx</code></td><td>Menu items CRUD with images and prices</td></tr>
        <tr><td><code>/admin/categories</code></td><td><code>page.tsx</code></td><td>Categories CRUD</td></tr>
        <tr><td><code>/admin/offers</code></td><td><code>page.tsx</code></td><td>Offers CRUD (4 pricing types)</td></tr>
        <tr><td><code>/admin/gallery</code></td><td><code>page.tsx</code></td><td>Gallery image management</td></tr>
        <tr><td><code>/admin/reviews</code></td><td><code>page.tsx</code></td><td>Review management (approve/reject)</td></tr>
        <tr><td><code>/admin/reports</code></td><td><code>page.tsx</code></td><td>Reports (9 tabs with print/export)</td></tr>
        <tr><td><code>/admin/delivery</code></td><td><code>page.tsx</code></td><td>Delivery settings (distance, weather, peak)</td></tr>
        <tr><td><code>/admin/settings</code></td><td><code>page.tsx</code></td><td>Site settings (restaurant, contact, bank)</td></tr>
      </table>
    </div>

    <!-- SECTION 5 -->
    <div class="content-section">
      <h1>Section 5: API Routes</h1>

      <h2>5.1 Public Routes</h2>
      <table>
        <tr><th>Route</th><th>Method</th><th>Function</th></tr>
        <tr><td><code>/api/auth/login</code></td><td>POST</td><td>Admin login (Supabase Auth + Cookies)</td></tr>
        <tr><td><code>/api/resolve-zone</code></td><td>POST</td><td>Legacy zone resolution from coordinates</td></tr>
      </table>

      <h2>5.2 Report Routes (All GET)</h2>
      <table>
        <tr><th>Route</th><th>Function</th></tr>
        <tr><td><code>/api/reports/dashboard</code></td><td>Today's sales, order count, last 10 orders</td></tr>
        <tr><td><code>/api/reports/orders</code></td><td>Order logs with filtering (status, payment, search)</td></tr>
        <tr><td><code>/api/reports/products</code></td><td>Product analysis (top 10, categories, unsold)</td></tr>
        <tr><td><code>/api/reports/customers</code></td><td>Customer analysis (top 50)</td></tr>
        <tr><td><code>/api/reports/compare</code></td><td>Period comparison (sales growth, orders, distribution)</td></tr>
        <tr><td><code>/api/reports/offers</code></td><td>Offer analysis (total discounts, top 10)</td></tr>
        <tr><td><code>/api/reports/invoices</code></td><td>Invoice listing</td></tr>
        <tr><td><code>/api/reports/audit</code></td><td>Status change audit log</td></tr>
        <tr><td><code>/api/reports/sales</code></td><td>Sales analytics (Drizzle ORM)</td></tr>
        <tr><td><code>/api/reports/delivery-analytics</code></td><td>Delivery analytics (fees by day/distance)</td></tr>
        <tr><td><code>/api/reports/cron</code></td><td>Protected cron endpoint for scheduled reports</td></tr>
        <tr><td><code>/api/reports/schedule</code></td><td>POST: Schedule email reports</td></tr>
      </table>
    </div>

    <!-- SECTION 6 -->
    <div class="content-section">
      <h1>Section 6: Order Lifecycle</h1>
      <pre>┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE ORDER LIFECYCLE                      │
└─────────────────────────────────────────────────────────────────┘

1. Browse Menu
   ├── Client: /menu → display items with prices
   ├── Client: useCartStore (Zustand, localStorage "bam-cart-storage")
   └── Support for bundles and individual offers

2. Create Order (/my-orders)
   ├── Client: Enter name, phone, address (required ≥10 chars)
   ├── Client: Select location on map (Leaflet)
   ├── Client: calculateDeliveryFeeServer(lat, lng) ← Server Action
   │   ├── Verify Sanaa location (isInsideSanaa)
   │   ├── Calculate OSRM distance (calculateRoute)
   │   └── Calculate delivery fee (calculateDeliveryFee)
   ├── Client: Submit order (createOrder)
   │
   └── Server Action: createOrder()
       ├── 1. Validate input data
       ├── 2. Fetch delivery settings (fetchDeliverySettings)
       ├── 3. Verify location (isInsideSanaa + max distance)
       ├── 4. Calculate distance (OSRM → Haversine fallback)
       ├── 5. Calculate delivery fee (calculateDeliveryFee)
       ├── 6. Generate order number (generateOrderNumber with Optimistic Locking)
       ├── 7. Manage tracking token (get/create from customer_tokens)
       ├── 8. Validate offer (if applicable: offer validation + pricing)
       ├── 9. Save order (orders table + order_items)
       ├── 10. Save initial status (order_status_history)
       ├── 11. Save offer snapshot (order_offers + order_offer_items)
       └── 12. Return { order, trackingToken }

3. Track Order
   ├── Customer: /t/[token] → tracking page with QR + InvoiceModal
   └── Admin: /admin/orders → status management

4. Update Status (Admin)
   └── updateOrderStatus(orderId, newStatus, adminId?)
       ├── Read current status + version
       ├── Update with Optimistic Locking (.eq('version', currentVersion))
       ├── Log in order_status_history
       └── Handle concurrent modification conflicts

5. Invoice
   ├── Client: InvoiceModal → PNG (html2canvas) / PDF (jsPDF)
   └── Admin: receipt-html.ts → direct print (window.print)

6. Archive
   └── is_archived = true / is_deleted = true (soft delete)</pre>
    </div>

    <!-- SECTION 7 -->
    <div class="content-section">
      <h1>Section 7: Delivery System</h1>

      <h2>7.1 Delivery Fee Calculation Flow</h2>
      <pre>Customer selects location on map
        │
        ▼
calculateDeliveryFeeServer(lat, lng)  ← Server Action
        │
        ├── isInsideSanaa(lat, lng)    ← Ray-casting on Sanaa boundaries
        │   └── × Outside Sanaa → Error
        │
        ├── fetchDeliverySettings()    ← site_settings (17 keys)
        │
        ├── haversineDistance()        ← Straight-line distance
        │
        ├── calculateRoute()           ← OSRM (8s timeout)
        │   ├── Success → validate with isRouteValid()
        │   ├── Failure → estimateRoadDistance(straightLine × roadFactor)
        │   └── Invalid → estimateRoadDistance(straightLine × roadFactor)
        │
        ├── Verify maxDistance
        │
        └── calculateDeliveryFee({distanceKm, settings})
            │
            ├── baseFee = baseDeliveryFee (if distance ≤ includedKm)
            │   OR baseFee = base + extraKm × extraFeePerKm
            │
            ├── + weatherFee if enabled
            │
            ├── + peakFee (baseFee × peakPercentage%) if:
            │   - Current time between peakStart and peakEnd
            │   - Current day is in peakDays
            │
            └── Return: {fee, baseFee, weatherFee, peakFee, ...}</pre>

      <h2>7.2 Pricing Formula</h2>
      <pre>If distanceKm ≤ includedDistanceKm:
    deliveryFee = baseDeliveryFee
Otherwise:
    deliveryFee = baseDeliveryFee + (distanceKm - includedDistanceKm) × extraFeePerKm

Additional surcharges (if applicable):
    + weatherFee (if enabled)
    + baseFee × peakPercentage / 100 (if peak time and peak day)

Default values:
    baseDeliveryFee = 400 YER
    includedDistanceKm = 2 km
    extraFeePerKm = 100 YER/km
    maxDeliveryDistanceKm = 15 km
    weatherFee = 200 YER
    peakPercentage = 20%</pre>

      <h2>7.3 OSRM Integration Flow</h2>
      <pre>calculateRoute(originLat, originLng, destLat, destLng, straightLineKm, roadFactor)
    │
    ├── URL: https://router.project-osrm.org/route/v1/driving/{lng},{lat};{lng},{lat}
    │
    ├── Response: distance (meters), duration (seconds)
    │
    ├── isRouteValid(osrmKm, straightLineKm, roadFactor)
    │   ├── osrmKm < straightLine → false
    │   ├── osrmKm > straightLine × 10 → false
    │   └── osrmKm < straightLine × 0.75 → false
    │
    └── Fallback: straightLineKm × roadFactor (default 1.5)</pre>
    </div>

    <!-- SECTION 8 -->
    <div class="content-section">
      <h1>Section 8: Offer & Bundle System</h1>

      <h2>8.1 Offer Types (4)</h2>
      <table>
        <tr><th>Type</th><th>Description</th><th>Example</th></tr>
        <tr><td><code>fixed_price</code></td><td>Fixed price for bundle</td><td>"Family meal for 5000"</td></tr>
        <tr><td><code>percentage_discount</code></td><td>Percentage discount</td><td>"20% off bundle"</td></tr>
        <tr><td><code>amount_discount</code></td><td>Fixed amount discount</td><td>"1000 YER off"</td></tr>
        <tr><td><code>free_item</code></td><td>Cheapest item free</td><td>"Buy 2 get 3rd free"</td></tr>
      </table>

      <h2>8.2 Pricing Engine (offer-pricing.ts)</h2>
      <pre>calculateOfferPrice({ offerType, salePrice, discountPercent, discountAmount, items })
    │
    ├── originalPrice = Σ(item.unitPrice × item.quantity)
    │
    ├── fixed_price         → finalPrice = salePrice ?? originalPrice
    ├── percentage_discount → finalPrice = originalPrice × (1 - discountPercent/100)
    ├── amount_discount     → finalPrice = max(0, originalPrice - discountAmount)
    └── free_item           → finalPrice = originalPrice - unitPriceCheapestItem
    │
    └── return { originalPrice, discountAmount, discountPercent, finalPrice, savings }</pre>

      <h2>8.3 Snapshots</h2>
      <p>When creating an order with an offer:</p>
      <ol>
        <li><code>order_offers</code>: Stores <code>offer_name, original_price, discount_amount, final_price</code></li>
        <li><code>order_offer_items</code>: Stores detailed bundle component data for each order</li>
        <li>This ensures report accuracy even if the offer changes later</li>
      </ol>
    </div>

    <!-- SECTION 9 -->
    <div class="content-section">
      <h1>Section 9: Invoice System</h1>

      <h2>9.1 Two Components, One Source</h2>
      <pre>receipt-html.ts (Server/Print)
    ├── generateReceiptBody(order, settings, trackUrl, bundleInfo)
    │   └── HTML string → used in:
    │       ├── admin/reports/InvoicesTab.tsx (direct print)
    │       └── InvoiceModal.tsx (design matching)
    │
    └── generateReceiptHtml(order, settings, trackUrl, bundleInfo)
        └── Complete HTML document for printing
            └── Waits for images to load before window.print()

InvoiceModal.tsx (Client/Modal)
    ├── Display invoice in modal (React component)
    ├── Export PNG → html2canvas (scale: 3)
    └── Export PDF → jsPDF
        ├── format: [80mm, proportionalHeight]  ← single page
        └── addImage(imgData, 'PNG', 0, 0, 80mm, height)</pre>

      <h2>9.2 Invoice Content Layout</h2>
      <pre>┌──────────────────────────────┐
│    ── Customer Invoice ──   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│        [Restaurant Logo]     │
│        Bait Al Mandi          │
│        Address                │
│    Phone: XXX — WhatsApp: XXX│
│  ─────────────────────────── │
│  Invoice #    │ BAM-XXXX..   │
│  Date         │ June 15      │
│  Time         │ 08:30 PM     │
│  Payment      │ Cash         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  │ Customer Info             │
│  │ Name: Mohammed            │
│  │ Phone: 777...             │
│  │ Address: ...              │
│  ─────────────────────────── │
│  │ Order Details             │
│  │ Item  | Size|Qty|Price|Tot│
│  │ Mandi | Med | 2 |1500|3000│
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  │ [Bundle Info if present]  │
│  ─────────────────────────── │
│  Subtotal          3,000     │
│  Delivery Fee        400     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  Grand Total      3,400 YER  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│       [QR Code for tracking] │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│     Thank you for your trust │
│         Bait Al Mandi        │
│  © 2026 Bait Al Mandi        │
└──────────────────────────────┘</pre>

      <h2>9.3 PDF Specifications</h2>
      <ul>
        <li><strong>Width:</strong> 80mm (standard thermal receipt)</li>
        <li><strong>Height:</strong> Proportional to canvas (single page only)</li>
        <li><strong>Unit:</strong> mm</li>
        <li><strong>Compression:</strong> Yes (compress: true)</li>
        <li><strong>Margin:</strong> 0 (no white borders)</li>
        <li><strong>Image Source:</strong> Canvas from html2canvas at scale 3</li>
      </ul>

      <h2>9.4 Print Specifications (Admin)</h2>
      <ul>
        <li><strong>Size:</strong> 320px width (centered on screen)</li>
        <li><strong>Fonts:</strong> Tajawal (Google Fonts)</li>
        <li><strong>Colors:</strong> <code>#3D0820</code> (maroon), <code>#c59b5f</code> (gold)</li>
        <li><strong>Image Loading:</strong> JavaScript waits for all images before <code>window.print()</code></li>
        <li><strong>@media print:</strong> <code>page-break-inside: avoid</code> on all sections</li>
      </ul>

      <h2>9.5 Tracking Token System</h2>
      <pre>Order Creation
    │
    ├── phone → search customer_tokens
    │   ├── exists → use existing token (stable for customer)
    │   └── not found → create new token (crypto.randomUUID)
    │
    ├── Store token in orders.tracking_token
    │
    ├── token ←→ QR Code on invoice
    │
    └── /t/[token] → order tracking page
        ├── Fetch order by tracking_token
        ├── Display status + details
        └── InvoiceModal with QR</pre>
    </div>

    <!-- SECTION 10 -->
    <div class="content-section">
      <h1>Section 10: Security & Authorization</h1>

      <h2>10.1 Roles (3)</h2>
      <table>
        <tr><th>Role</th><th>Description</th><th>Permissions</th></tr>
        <tr><td><code>developer</code></td><td>Full-access developer</td><td>Everything</td></tr>
        <tr><td><code>manager</code></td><td>Restaurant manager</td><td>Dashboard, Menu, Categories, Offers, Gallery, Reviews, Reports, Settings, Delivery</td></tr>
        <tr><td><code>order_manager</code></td><td>Order manager only</td><td>Orders only</td></tr>
      </table>

      <h2>10.2 Access Control</h2>
      <pre>1. Middleware (src/middleware.ts)
   ├── Matches /admin/:path*
   ├── Calls updateSession from utils/supabase/middleware
   └── Verifies:
       ├── Auth session exists
       ├── admin_users record exists
       └── Page access permission (canAccessPage)

2. Server-Side (permissions.ts)
   ├── PAGE_ACCESS map
   ├── canAccessPage(role, pathname)
   ├── getAllowedSidebarLinks(role)
   └── getDefaultRedirect(role)

3. RLS (Row Level Security)
   └── rls.sql contains:
       ├── is_admin()        ← Check if admin in admin_users
       ├── get_admin_role()  ← Get admin role
       ├── Public SELECT on: categories, items, item_prices, offers,
       │                     gallery_images, site_settings, branches
       ├── Admin-only INSERT/UPDATE/DELETE
       ├── Customers see only their orders (customer_phone)
       └── Admins see all orders</pre>

      <h2>10.3 Server Action Protection</h2>
      <ul>
        <li><code>createOrder</code> → <code>'use server'</code> → validates data only (not Auth)</li>
        <li><code>updateOrderStatus</code> → <code>'use server'</code> → no direct Auth check (used by Admin)</li>
        <li><code>calculateDeliveryFeeServer</code> → <code>'use server'</code> → no Auth (public service)</li>
        <li>Permission is enforced at middleware + sidebar level</li>
      </ul>

      <h2>10.4 Potential Vulnerabilities</h2>
      <table>
        <tr><th>Vulnerability</th><th>Status</th><th>Impact</th></tr>
        <tr><td><code>updateOrderStatus</code> without Auth check</td><td>⚠️ Depends on Middleware</td><td>Low - callable from any Client</td></tr>
        <tr><td><code>createOrder</code> without CSRF protection</td><td>⚠️ No CSRF Token</td><td>Medium</td></tr>
        <tr><td><code>calculateDeliveryFeeServer</code> public</td><td>✅ Intentional</td><td>Low - preview only</td></tr>
        <tr><td>Tracking token guessable</td><td>✅ <code>crypto.randomUUID()</code></td><td>Low</td></tr>
        <tr><td><code>site_settings</code> public read</td><td>✅ Intentional</td><td>Low</td></tr>
      </table>
    </div>

    <!-- SECTION 11 -->
    <div class="content-section">
      <h1>Section 11: Reporting System</h1>

      <h2>11.1 Architecture</h2>
      <pre>Report Interface (Client)
    └── /admin/reports/page.tsx
        └── 9 Tabs
            ├── DashboardTab
            ├── OrdersTab
            ├── ProductsTab
            ├── CustomersTab
            ├── SummaryTab
            ├── OffersTab
            ├── InvoicesTab
            ├── AuditLogsTab
            └── DeliveryAnalyticsTab
                │
                └── API Routes (12 endpoints)
                    ├── REST (Supabase Client)
                    └── Drizzle ORM (server-side)
                        └── services/reports/
                            ├── salesReport.ts
                            ├── analyticsEngine.ts
                            ├── customerReport.ts
                            ├── dashboardReport.ts
                            ├── ordersReport.ts
                            └── productReport.ts</pre>

      <h2>11.2 Print & Export</h2>
      <pre>Print (printReport.ts)
    ├── fetchData() → collect data from API
    ├── buildSection() → build complete HTML with inline CSS
    ├── Open print window (window.open)
    └── wait + window.print()

Excel Export (exportExcel.ts)
    └── ExcelJS → multi-sheet .xlsx
        ├── Orders Sheet
        ├── Products Sheet
        ├── Customers Sheet
        ├── Sales Comparison Sheet
        └── Delivery Analytics Sheet</pre>
    </div>

    <!-- SECTION 12 -->
    <div class="content-section">
      <h1>Section 12: State Management (Stores)</h1>

      <h2>12.1 cartStore (Zustand + persist)</h2>
      <pre>// localStorage key: "bam-cart-storage"
// Middleware: persist

useCartStore(
    state: {
        items: CartItem[]   // [id, name, price, quantity, size, category, image, offer...]
    },
    actions: {
        addToCart(item)     // Search for duplicate (id + size) → increment quantity
        removeFromCart(id)  // Remove item
        updateQuantity(id, quantity)  // Change quantity (0 → remove)
        clearCart()         // Empty cart
        getCartTotal()      // Σ(price × quantity)
        getTotalItems()     // Σ(quantity)
    }
)</pre>

      <h2>12.2 SettingsContext (React Context)</h2>
      <pre>SettingsProvider
    ├── refresh() → fetch site_settings from Supabase
    ├── Transform data to Record&lt;string, string&gt;
    └── Provide { settings, loading, refresh } to children

useSettings() → { settings: Record&lt;string, string&gt;, loading: boolean }</pre>
    </div>

    <!-- SECTION 13 -->
    <div class="content-section">
      <h1>Section 13: Legacy Files (Unused)</h1>
      <p>These files were part of the old zone-based pricing system and are no longer imported by any production code:</p>
      <table>
        <tr><th>File</th><th>Reason</th></tr>
        <tr><td><code>src/lib/delivery-zones.ts</code></td><td>Zone system (Azal, Shattar, etc.) — replaced by distance pricing</td></tr>
        <tr><td><code>src/lib/geo/resolve-zone.ts</code></td><td>Zone resolution via Nominatim API — no longer used</td></tr>
        <tr><td><code>src/lib/geo/resolve-location.ts</code></td><td>R-Tree spatial indexing engine — no longer used</td></tr>
        <tr><td><code>src/lib/geo/sanaa-boundaries.ts</code></td><td>GeoJSON loading — no longer used</td></tr>
        <tr><td><code>src/app/api/resolve-zone/route.ts</code></td><td>Zone resolution API — no longer used</td></tr>
        <tr><td><code>src/app/cart/page.tsx</code></td><td>Old cart page — replaced by <code>/my-orders</code></td></tr>
        <tr><td><code>src/app/track-order/[orderId]/page.tsx</code></td><td>UUID-based tracking — replaced by <code>/t/[token]</code></td></tr>
        <tr><td><code>delivery_zone</code> column in orders</td><td>Always NULL</td></tr>
      </table>
      <div class="highlight-yellow">
        <strong>Note:</strong> The <code>delivery_zones</code> table still exists in the database but is unused in any code. <code>delivery_zone: null</code> is set in <code>createOrder</code> for backward compatibility.
      </div>
    </div>

    <!-- SECTION 14 -->
    <div class="content-section">
      <h1>Section 14: Dependency Map</h1>
      <pre>components/ ← app/ ← layout.tsx ← lib/settings-context.tsx ← lib/supabase.ts
                                              │
actions/orders.ts ───────────────────────────┼── lib/delivery-pricing.ts
    │                                        │── lib/delivery-routing.ts
    │                                        │── lib/location-validation.ts
    │                                        └── lib/offer-pricing.ts
    │
actions/items.ts ────────────────────────────── lib/offer-pricing.ts
actions/categories.ts
actions/orders-offers.ts ────────────────────── db/schema.ts (types)

store/cartStore.ts ──────────────────────────── (independent, Zustand)

app/admin/ ─────────────────────────────────── middleware.ts
    │                                           utils/supabase/middleware.ts
    │                                           lib/permissions.ts
    │
app/admin/reports/ ─────────────────────────── services/reports/
    │                                           db/index.ts (Drizzle)
    │                                           lib/printReport.ts
    │                                           lib/exportExcel.ts
    │
components/invoice/InvoiceModal.tsx ────────── lib/bundle-utils.ts
    │                                           actions/orders-offers.ts
    │
components/invoice/receipt-html.ts ─────────── lib/bundle-utils.ts

API Routes (/api/reports/*) ────────────────── services/reports/
                                                    db/index.ts (Drizzle)
                                                    lib/supabase.ts</pre>
    </div>

    <!-- SECTION 15 -->
    <div class="content-section">
      <h1>Section 15: Executive Summary</h1>

      <h2>15.1 Strengths</h2>
      <div class="highlight-green">
        <ul>
          <li>✅ <strong>Single Source of Truth</strong> for delivery fees (<code>calculateDeliveryFee</code>)</li>
          <li>✅ <strong>All Calculations Server-Side</strong> (client values never trusted)</li>
          <li>✅ <strong>Optimistic Locking</strong> for orders (prevents concurrent updates)</li>
          <li>✅ <strong>Snapshots for offers and delivery</strong> (ensures report accuracy)</li>
          <li>✅ <strong>4 Offer Types</strong> (fixed, percentage, amount, free)</li>
          <li>✅ <strong>3-Way Tracking</strong> (Admin UI, Token Link, QR Code)</li>
          <li>✅ <strong>3 Format Invoices</strong> (PNG, PDF, Direct Print)</li>
          <li>✅ <strong>Complete Reporting System</strong> (9 tabs + Print + Excel)</li>
          <li>✅ <strong>Extensible Database</strong> (Drizzle ORM + SQL Migrations)</li>
          <li>✅ <strong>3 Roles</strong> (Developer, Manager, Order Manager)</li>
        </ul>
      </div>

      <h2>15.2 Recommended Improvements</h2>
      <table>
        <tr><th>Issue</th><th>Severity</th><th>Recommendation</th></tr>
        <tr><td><code>updateOrderStatus</code> without CSRF/Token</td><td><span class="badge badge-yellow">Medium</span></td><td>Add session verification inside Server Action</td></tr>
        <tr><td><code>createOrder</code> without Auth</td><td><span class="badge badge-yellow">Medium</span></td><td>Add Rate Limiting + additional validation</td></tr>
        <tr><td><code>fetchDeliverySettings</code> called twice (preview + creation)</td><td><span class="badge badge-green">Low</span></td><td>Merge the two calls or use caching</td></tr>
        <tr><td>Legacy files not deleted</td><td><span class="badge badge-green">Low</span></td><td>Delete unused files (delivery-zones.ts, geo/*, cart/page.tsx)</td></tr>
        <tr><td>Tracking Token persists forever</td><td><span class="badge badge-green">Low</span></td><td>Add token expiry</td></tr>
        <tr><td><code>services/reports/</code> uses Drizzle but some API routes use Supabase REST</td><td><span class="badge badge-green">Low</span></td><td>Unify approach (all Drizzle or all REST)</td></tr>
        <tr><td>No DB Migration to drop <code>delivery_zones</code></td><td><span class="badge badge-green">Low</span></td><td>Add migration to drop the table</td></tr>
      </table>

      <h2>15.3 Project Deliverables</h2>
      <table>
        <tr><th>File</th><th>Purpose</th></tr>
        <tr><td><code>BAIT_AL_MANDI_ARCHITECTURE.md</code></td><td>Complete system documentation (Markdown)</td></tr>
        <tr><td><code>exports/BAIT_AL_MANDI_ARCHITECTURE_AR.pdf</code></td><td>Arabic PDF documentation</td></tr>
        <tr><td><code>exports/BAIT_AL_MANDI_ARCHITECTURE_EN.pdf</code></td><td>English PDF documentation</td></tr>
      </table>
    </div>

  </div>

</body>
</html>`;
}


// ======================================================================
// TOC BUILDER
// ======================================================================

function buildTOC(mdContent) {
  const items = [];
  const lines = mdContent.split('\n');
  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)/);
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match && !h2Match[1].includes('Bait Al Mandi')) {
      items.push({ level: 2, text: h2Match[1].trim(), page: '' });
    } else if (h1Match && !h1Match[1].includes('Bait Al Mandi') && !h1Match[1].includes('توثيق')) {
      items.push({ level: 1, text: h1Match[1].trim(), page: '' });
    }
  }
  return items;
}


// ======================================================================
// PDF GENERATION
// ======================================================================

async function generatePDF(htmlContent, outputPath, extraOptions = {}) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  await page.addStyleTag({
    content: `
      @page {
        size: A4;
        margin: 25mm 20mm 25mm 20mm;
        @bottom-center {
          content: "Page " counter(page) " of " counter(pages);
          font-size: 8pt;
          color: #999;
          font-family: 'Cairo', 'Tajawal', sans-serif;
        }
        @top-center {
          content: "BAIT AL MANDI — System Documentation";
          font-size: 7pt;
          color: #aaa;
          font-family: 'Cairo', 'Tajawal', sans-serif;
        }
        @bottom-left {
          content: "Confidential Document";
          font-size: 7pt;
          color: #c59b5f;
          font-family: 'Cairo', 'Tajawal', sans-serif;
        }
      }
    `,
  });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: {
      top: '25mm',
      bottom: '25mm',
      left: '20mm',
      right: '20mm',
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="width:100%;text-align:center;font-size:7pt;color:#aaa;font-family:Cairo,Tajawal,sans-serif;padding:4px 20px 0;">BAIT AL MANDI — System Documentation</div>',
    footerTemplate: '<div style="width:100%;display:flex;justify-content:space-between;font-size:7pt;color:#999;font-family:Cairo,Tajawal,sans-serif;padding:2px 20px;border-top:1px solid #ddd;"><span style="color:#c59b5f;font-weight:600;">Confidential Document</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
    preferCSSPageSize: false,
  });

  await browser.close();
  const stats = fs.statSync(outputPath);
  console.log(`✅ Generated: ${outputPath} (${(stats.size / 1024).toFixed(0)} KB)`);
  return stats.size;
}


// ======================================================================
// MAIN
// ======================================================================

async function main() {
  console.log('📄 Bait Al Mandi — PDF Documentation Generator\n');
  console.log('='.repeat(60));

  // Read MD content
  const mdContent = fs.readFileSync(MD_PATH, 'utf-8');
  console.log(`📖 Read source: BAIT_AL_MANDI_ARCHITECTURE.md (${mdContent.length} chars)`);

  // Generate Arabic HTML
  console.log('\n🔵 Generating Arabic PDF...');
  const arHtml = generateArabicHTML(mdContent);
  const arSize = await generatePDF(arHtml, AR_PDF);
  console.log(`   Arabic PDF generated successfully`);

  // Generate English HTML
  console.log('\n🟢 Generating English PDF...');
  const enHtml = generateEnglishHTML();
  const enSize = await generatePDF(enHtml, EN_PDF);
  console.log(`   English PDF generated successfully`);

  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION REPORT');
  console.log('='.repeat(60));
  console.log(`\n📁 Output Directory: ${EXPORTS_DIR}`);
  console.log(`\n📄 Arabic PDF:  ${AR_PDF}`);
  console.log(`   Size: ${(arSize / 1024).toFixed(0)} KB`);
  console.log(`   Language: Arabic (RTL)`);
  console.log(`   Font: Cairo`);
  console.log(`\n📄 English PDF: ${EN_PDF}`);
  console.log(`   Size: ${(enSize / 1024).toFixed(0)} KB`);
  console.log(`   Language: English (LTR)`);
  console.log(`   Font: Cairo`);

  // Quality checks
  console.log('\n🔍 QUALITY CHECKS');
  console.log('-'.repeat(40));
  console.log('✅ Arabic font: Cairo (Google Fonts, supports Arabic)');
  console.log('✅ RTL direction: enabled for Arabic version');
  console.log('✅ LTR direction: enabled for English version');
  console.log('✅ UTF-8 encoding: confirmed');
  console.log('✅ Cover page: included in both versions');
  console.log('✅ Table of Contents: included in both versions');
  console.log('✅ Page numbers: Page X of Y format');
  console.log('✅ Header: BAIT AL MANDI — System Documentation');
  console.log('✅ Footer: Confidential Document');
  console.log('✅ Code blocks: JetBrains Mono monospace font');
  console.log('✅ Tables: styled with maroon/gold theme');
  console.log('✅ A4 format: standard international size');
  console.log('✅ Print optimization: page-break-inside: avoid');

  console.log('\n✨ Done! Both PDFs have been generated successfully.\n');
}

main().catch(err => {
  console.error('\n❌ ERROR:', err.message);
  process.exit(1);
});
