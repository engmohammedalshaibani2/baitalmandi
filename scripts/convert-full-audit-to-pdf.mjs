import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';

const projectRoot = 'C:\\Users\\MOHAMMED GAMEEL\\baitalmandiwibapp';
const mdPath = `${projectRoot}\\PROJECT_FULL_AUDIT_REPORT.md`;
const pdfPath = `${projectRoot}\\PROJECT_FULL_AUDIT_REPORT.pdf`;

const md = readFileSync(mdPath, 'utf-8');

const bodyHtml = marked.parse(md, { breaks: true });

const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Tajawal', 'Segoe UI', sans-serif;
    direction: rtl;
    text-align: right;
    color: #1C1C1E;
    background: #FAF5EC;
    padding: 40px 50px;
    line-height: 1.8;
    font-size: 10pt;
  }
  h1 {
    font-size: 20pt; color: #8B4513; text-align: center;
    margin-bottom: 10px; font-weight: 900;
    border-bottom: 3px solid #C59B5F;
    padding-bottom: 12px;
  }
  h2 {
    font-size: 15pt; color: #8B4513;
    border-bottom: 2px solid #C59B5F;
    padding-bottom: 6px; margin: 28px 0 14px;
    font-weight: 700;
  }
  h3 {
    font-size: 12pt; color: #5C3317;
    margin: 18px 0 10px; font-weight: 700;
  }
  h4 {
    font-size: 10pt; color: #5C3317;
    margin: 14px 0 8px; font-weight: 700;
  }
  p { margin-bottom: 8px; }
  table {
    width: 100%; border-collapse: collapse;
    margin: 12px 0; font-size: 8pt;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #C59B5F;
    padding: 5px 7px; text-align: right;
    vertical-align: top;
  }
  th {
    background: #C59B5F; color: #fff; font-weight: 700;
  }
  td { background: #fff; }
  tr:nth-child(even) td { background: #FDF5ED; }
  code {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    background: #F0EAE1; padding: 1px 5px;
    border-radius: 3px; font-size: 7.5pt;
    direction: ltr; display: inline-block;
    unicode-bidi: embed;
  }
  pre {
    background: #1C1C1E; color: #F4EFE6;
    padding: 10px 14px; border-radius: 6px;
    overflow-x: auto; direction: ltr;
    text-align: left; font-size: 7pt;
    line-height: 1.5; margin: 8px 0;
    page-break-inside: avoid;
  }
  pre code {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    background: none; color: inherit;
    padding: 0; font-size: inherit;
  }
  strong { color: #5C3317; font-weight: 700; }
  hr {
    border: none; border-top: 1px solid #C59B5F;
    margin: 25px 0;
  }
  ul, ol { margin: 6px 0 6px 20px; padding-right: 20px; }
  li { margin-bottom: 3px; }
  blockquote {
    border-right: 4px solid #C59B5F;
    padding: 8px 12px; margin: 12px 0;
    background: #FDF5ED; font-size: 9pt;
  }
  .page-break { page-break-after: always; }
  @page {
    margin: 25px 30px;
  }
  /* Risk labels */
  .risk-critical { color: #D32F2F; font-weight: 700; }
  .risk-high { color: #E65100; font-weight: 700; }
  .risk-medium { color: #F9A825; font-weight: 700; }
  .risk-low { color: #388E3C; font-weight: 700; }
  .risk-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-left: 4px; }
  .dot-critical { background: #D32F2F; }
  .dot-high { background: #E65100; }
  .dot-medium { background: #F9A825; }
  .dot-low { background: #388E3C; }
  a { color: #8B4513; text-decoration: none; }
  /* Fix table with emoji/unicode */
  .table-container { overflow-x: auto; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

writeFileSync(`${projectRoot}\\docs\\audit-output.html`, html, 'utf-8');
console.log('HTML generated. Launching Edge...');

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

await page.pdf({
  path: pdfPath,
  format: 'A4',
  margin: { top: '25px', bottom: '30px', left: '30px', right: '30px' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:7pt;color:#999;text-align:center;width:100%;padding:3px 0;font-family:Tajawal,sans-serif;">بيت المندي — تقرير التدقيق الشامل للنظام (Full Audit Report)</div>',
  footerTemplate: '<div style="font-size:7pt;color:#999;text-align:center;width:100%;padding:3px 0;font-family:Tajawal,sans-serif;">الصفحة <span class="pageNumber"></span> من <span class="totalPages"></span> | 18 يونيو 2026</div>',
});

await browser.close();
console.log('PDF generated: ' + pdfPath);
