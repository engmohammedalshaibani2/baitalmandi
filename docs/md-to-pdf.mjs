import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join(__dirname, 'SYSTEM_ARCHITECTURE.md');
const outPath = path.join(__dirname, 'SYSTEM_ARCHITECTURE.html');

const md = fs.readFileSync(mdPath, 'utf8');

// ─── Minimal Markdown → HTML converter ────────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function parseMd(raw) {
  const lines = raw.split('\n');
  const out = [];
  let i = 0;

  const inlineFormat = (s) => {
    // code spans
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // bold
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // italic
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // links
    s = s.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    return s;
  };

  while (i < lines.length) {
    const line = lines[i];

    // --- Fenced code blocks ---
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const isMermaid = lang === 'mermaid';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const codeText = codeLines.join('\n');
      if (isMermaid) {
        out.push(`<div class="mermaid">${escHtml(codeText)}</div>`);
      } else {
        out.push(`<pre><code class="lang-${escHtml(lang)}">${escHtml(codeText)}</code></pre>`);
      }
      i++;
      continue;
    }

    // --- GitHub-style alerts ---
    const alertMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
    if (alertMatch) {
      const type = alertMatch[1].toLowerCase();
      const alertLines = [];
      // collect continuation lines
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith('>')) {
        alertLines.push(lines[j].replace(/^>\s?/, ''));
        j++;
      }
      const icons = { note:'ℹ️', tip:'💡', important:'⚠️', warning:'🔶', caution:'🔴' };
      out.push(`<div class="alert alert-${type}"><strong>${icons[type]} ${alertMatch[1]}</strong> ${inlineFormat(alertLines.join(' '))}</div>`);
      i = j;
      continue;
    }

    // --- Blockquotes ---
    if (line.startsWith('>')) {
      const bqLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        bqLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${inlineFormat(bqLines.join('<br>'))}</blockquote>`);
      continue;
    }

    // --- Headings ---
    const h = line.match(/^(#{1,6})\s+(.*)/);
    if (h) {
      const level = h[1].length;
      const text = inlineFormat(escHtml(h[2]));
      const id = h[2].replace(/[^\w\u0600-\u06FF]+/g, '-').toLowerCase();
      out.push(`<h${level} id="${id}">${text}</h${level}>`);
      i++;
      continue;
    }

    // --- Horizontal rule ---
    if (/^---+$/.test(line.trim())) {
      out.push('<hr>');
      i++;
      continue;
    }

    // --- Tables ---
    if (line.includes('|') && i + 1 < lines.length && lines[i+1].match(/^\|?[\s\-|:]+\|?$/)) {
      const tableLines = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].includes('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      const rows = tableLines.map(r =>
        r.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || arr.length === 1)
      );
      // Remove separator row (index 1)
      const header = rows[0];
      const body = rows.slice(2);
      const headHtml = header.map(c => `<th>${inlineFormat(c.trim())}</th>`).join('');
      const bodyHtml = body.map(row =>
        `<tr>${row.map(c => `<td>${inlineFormat(c.trim())}</td>`).join('')}</tr>`
      ).join('\n');
      out.push(`<table>\n<thead><tr>${headHtml}</tr></thead>\n<tbody>${bodyHtml}</tbody>\n</table>`);
      i = j;
      continue;
    }

    // --- Unordered list ---
    if (/^(\s*)[-*]\s/.test(line)) {
      const listLines = [];
      while (i < lines.length && /^(\s*)[-*]\s/.test(lines[i])) {
        const indent = lines[i].match(/^(\s*)/)[1].length;
        const text = lines[i].replace(/^\s*[-*]\s/, '');
        listLines.push({ indent, text });
        i++;
      }
      out.push('<ul>');
      for (const item of listLines) {
        out.push(`<li>${inlineFormat(item.text)}</li>`);
      }
      out.push('</ul>');
      continue;
    }

    // --- Ordered list ---
    if (/^\d+\.\s/.test(line)) {
      out.push('<ol>');
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s/, '');
        out.push(`<li>${inlineFormat(text)}</li>`);
        i++;
      }
      out.push('</ol>');
      continue;
    }

    // --- Empty line ---
    if (line.trim() === '') {
      i++;
      continue;
    }

    // --- Paragraph ---
    out.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  return out.join('\n');
}

const body = parseMd(md);

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>وثيقة معمارية النظام - بيت المندي</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  :root {
    --gold: #c59b5f;
    --dark-red: #3D0820;
    --bg: #ffffff;
    --text: #1a1a1a;
    --text-muted: #555;
    --border: #e0e0e0;
    --code-bg: #f5f5f5;
    --accent: #f0e8d8;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @page {
    size: A4;
    margin: 18mm 20mm 18mm 20mm;
  }

  body {
    font-family: 'Tajawal', 'Arial', sans-serif;
    font-size: 13px;
    line-height: 1.9;
    color: var(--text);
    background: var(--bg);
    direction: rtl;
  }

  /* ── COVER PAGE ─────────────────────────────── */
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
    page-break-after: always;
    padding: 60px 40px;
    background: linear-gradient(160deg, var(--dark-red) 0%, #6b1033 60%, #3D0820 100%);
    color: white;
  }
  .cover-logo {
    font-size: 72px;
    margin-bottom: 24px;
  }
  .cover-restaurant {
    font-size: 36px;
    font-weight: 900;
    color: var(--gold);
    letter-spacing: 2px;
    margin-bottom: 8px;
  }
  .cover-subtitle {
    font-size: 18px;
    font-weight: 300;
    color: rgba(255,255,255,0.8);
    margin-bottom: 48px;
  }
  .cover-divider {
    width: 120px;
    height: 3px;
    background: var(--gold);
    margin: 0 auto 40px;
    border-radius: 2px;
  }
  .cover-title {
    font-size: 26px;
    font-weight: 800;
    line-height: 1.5;
    margin-bottom: 16px;
  }
  .cover-en-title {
    font-size: 15px;
    font-weight: 400;
    color: rgba(255,255,255,0.65);
    margin-bottom: 60px;
  }
  .cover-meta {
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    line-height: 2;
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 24px;
    width: 100%;
    max-width: 500px;
  }
  .cover-meta strong { color: var(--gold); }

  /* ── CONTENT WRAPPER ─────────────────────────── */
  .content {
    max-width: 850px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  /* ── TABLE OF CONTENTS ─────────────────────────── */
  .toc {
    page-break-after: always;
    padding: 40px 0;
  }
  .toc h2 {
    font-size: 22px;
    color: var(--dark-red);
    border-bottom: 3px solid var(--gold);
    padding-bottom: 10px;
    margin-bottom: 24px;
  }
  .toc ol { padding-right: 20px; }
  .toc li {
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--text-muted);
  }
  .toc li strong { color: var(--text); }

  /* ── HEADINGS ─────────────────────────── */
  h1 {
    font-size: 26px;
    font-weight: 900;
    color: var(--dark-red);
    border-bottom: 4px solid var(--gold);
    padding-bottom: 12px;
    margin: 44px 0 20px;
    page-break-after: avoid;
  }
  h2 {
    font-size: 20px;
    font-weight: 800;
    color: var(--dark-red);
    border-right: 5px solid var(--gold);
    padding-right: 14px;
    margin: 36px 0 16px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 16px;
    font-weight: 700;
    color: #2a2a2a;
    margin: 28px 0 12px;
    page-break-after: avoid;
  }
  h4 {
    font-size: 14px;
    font-weight: 700;
    color: var(--gold);
    margin: 20px 0 8px;
    page-break-after: avoid;
  }

  /* ── PARAGRAPHS ─────────────────────────── */
  p {
    margin: 10px 0;
    color: var(--text-muted);
  }

  /* ── LISTS ─────────────────────────── */
  ul, ol {
    padding-right: 24px;
    margin: 10px 0 14px;
  }
  li {
    margin-bottom: 6px;
    color: var(--text-muted);
  }
  li strong { color: var(--text); }

  /* ── CODE ─────────────────────────── */
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    background: var(--code-bg);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--dark-red);
    direction: ltr;
    display: inline-block;
  }
  pre {
    background: #1a1a2e;
    color: #e8e8e8;
    padding: 16px 20px;
    border-radius: 10px;
    overflow-x: auto;
    margin: 16px 0;
    direction: ltr;
    text-align: left;
    font-size: 11px;
    line-height: 1.7;
    page-break-inside: avoid;
    border-right: 4px solid var(--gold);
  }
  pre code {
    background: transparent;
    color: #e8e8e8;
    padding: 0;
    font-size: 11px;
  }

  /* ── TABLES ─────────────────────────── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 12px;
    page-break-inside: avoid;
  }
  th {
    background: var(--dark-red);
    color: var(--gold);
    padding: 10px 14px;
    text-align: right;
    font-weight: 700;
  }
  td {
    padding: 9px 14px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #fafafa; }
  tr:hover td { background: var(--accent); }

  /* ── BLOCKQUOTE ─────────────────────────── */
  blockquote {
    border-right: 4px solid var(--gold);
    margin: 16px 0;
    padding: 12px 20px;
    background: var(--accent);
    color: var(--text-muted);
    border-radius: 0 8px 8px 0;
    font-size: 12px;
    page-break-inside: avoid;
  }

  /* ── ALERTS ─────────────────────────── */
  .alert {
    margin: 16px 0;
    padding: 14px 18px;
    border-radius: 8px;
    font-size: 12px;
    page-break-inside: avoid;
    border-right: 4px solid;
  }
  .alert strong { display: block; margin-bottom: 4px; }
  .alert-note { background: #e8f4fd; border-color: #3b82f6; color: #1e3a5f; }
  .alert-tip { background: #e8fdf0; border-color: #10b981; color: #1a3d2e; }
  .alert-important { background: #fff8e8; border-color: #f59e0b; color: #3d2e00; }
  .alert-warning { background: #fff3e8; border-color: #f97316; color: #3d1e00; }
  .alert-caution { background: #fde8e8; border-color: #ef4444; color: #3d0000; }

  /* ── MERMAID DIAGRAMS ─────────────────────────── */
  .mermaid {
    background: #f8f8ff;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px;
    margin: 20px 0;
    text-align: center;
    page-break-inside: avoid;
    overflow: auto;
  }

  /* ── HR ─────────────────────────── */
  hr {
    border: none;
    border-top: 2px solid var(--gold);
    margin: 32px 0;
    opacity: 0.4;
  }

  /* ── PAGE BREAK ─────────────────────────── */
  .page-break { page-break-before: always; }

  /* ── PRINT ─────────────────────────── */
  @media print {
    body { background: white; }
    .cover { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .alert { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    th { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }

  /* ── FOOTER ─────────────────────────── */
  .doc-footer {
    margin-top: 60px;
    padding: 24px;
    text-align: center;
    border-top: 2px solid var(--gold);
    color: var(--text-muted);
    font-size: 11px;
  }
  .doc-footer strong { color: var(--dark-red); }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-logo">🍽️</div>
  <div class="cover-restaurant">بيت المندي</div>
  <div class="cover-subtitle">Bait Al Mandi Restaurant Platform</div>
  <div class="cover-divider"></div>
  <div class="cover-title">وثيقة المواصفات الفنية ومعمارية النظام</div>
  <div class="cover-en-title">System Architecture & Technical Specification Document</div>
  <div class="cover-meta">
    <div>المطوّر: <strong>شركة إسناد التقنية (Esnaad Tech)</strong></div>
    <div>الإطار التقني: <strong>Next.js 14 · Supabase · PostgreSQL · Drizzle ORM</strong></div>
    <div>تاريخ الإصدار: <strong>${new Date().toLocaleDateString('ar-YE', {year:'numeric',month:'long',day:'numeric'})}</strong></div>
    <div>الإصدار: <strong>v1.0 — وثيقة سرية للاستخدام الداخلي</strong></div>
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="content">
<div class="toc">
<h2>📋 فهرس المحتويات</h2>
<ol>
  <li><strong>Executive Overview</strong> — نظرة عامة تنفيذية</li>
  <li><strong>System Architecture</strong> — المعمارية العامة للنظام</li>
  <li><strong>Architecture Diagram</strong> — مخطط Mermaid التفاعلي</li>
  <li><strong>Project Structure</strong> — هيكل المشروع والمجلدات</li>
  <li><strong>Backend Architecture</strong> — بنية الخلفية وطبقات الأعمال</li>
  <li><strong>Database Architecture</strong> — قاعدة البيانات وسياسات الأمان</li>
  <li><strong>Frontend Architecture</strong> — بنية الواجهة الأمامية</li>
  <li><strong>Core System Workflows</strong> — تدفقات العمليات الأساسية</li>
  <li><strong>Integrations & External Services</strong> — التكاملات والخدمات الخارجية</li>
  <li><strong>Scalability & Growth Plan</strong> — خطة التوسع والنمو</li>
  <li><strong>Code & Architecture Improvements</strong> — التحسينات الفنية المقترحة</li>
  <li><strong>Final CTO Assessment</strong> — التقييم الفني النهائي</li>
  <li><strong>PDF-Ready Format</strong> — جاهزية الطباعة والتحويل</li>
</ol>
</div>

<!-- DOCUMENT BODY -->
${body}

<!-- FOOTER -->
<div class="doc-footer">
  <strong>بيت المندي</strong> — وثيقة سرية للاستخدام الداخلي فقط<br>
  تم إعدادها بواسطة <strong>شركة إسناد التقنية (Esnaad Tech)</strong> · ${new Date().getFullYear()}
</div>
</div>

<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
      primaryColor: '#3D0820',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#c59b5f',
      lineColor: '#c59b5f',
      secondaryColor: '#f0e8d8',
      tertiaryColor: '#fafafa',
      fontFamily: 'Tajawal, Arial',
      fontSize: '13px',
    },
    flowchart: { rankSpacing: 60, nodeSpacing: 40, curve: 'basis' }
  });

  // Auto-print after Mermaid renders (for PDF conversion)
  mermaid.init(undefined, '.mermaid').then(() => {
    console.log('[PDF] Mermaid diagrams rendered. Ready to print.');
  }).catch(() => {
    console.log('[PDF] Mermaid rendering skipped.');
  });
</script>
</body>
</html>`;

fs.writeFileSync(outPath, html, 'utf8');
console.log(`\n✅ HTML file generated successfully!\n📄 Path: ${outPath}\n`);
console.log('🖨️  HOW TO CONVERT TO PDF:');
console.log('   1. Open the HTML file in Google Chrome');
console.log('   2. Press Ctrl+P (Print)');
console.log('   3. Set Destination → "Save as PDF"');
console.log('   4. Set Paper Size → A4, Margins → None/Minimum');
console.log('   5. Enable "Background graphics" checkbox');
console.log('   6. Click Save\n');
