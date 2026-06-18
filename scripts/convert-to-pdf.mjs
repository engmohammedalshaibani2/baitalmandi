import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';

const mdPath = 'C:\\Users\\MOHAMMED GAMEEL\\baitalmandiwibapp\\docs\\تقرير_التدقيق_المعماري_وتحليل_PWA.md';
const pdfPath = 'C:\\Users\\MOHAMMED GAMEEL\\baitalmandiwibapp\\docs\\تقرير_التدقيق_المعماري_وتحليل_PWA.pdf';

const md = readFileSync(mdPath, 'utf-8');

const bodyHtml = marked.parse(md, { breaks: true });

const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Tajawal', 'Segoe UI', sans-serif;
    direction: rtl;
    text-align: right;
    color: #1C1C1E;
    background: #FAF5EC;
    padding: 40px 50px;
    line-height: 1.8;
    font-size: 11pt;
  }
  h1 { font-size: 22pt; color: #8B4513; text-align: center; margin-bottom: 20px; }
  h2 { font-size: 16pt; color: #8B4513; border-bottom: 2px solid #C59B5F; padding-bottom: 6px; margin: 30px 0 15px; }
  h3 { font-size: 13pt; color: #5C3317; margin: 20px 0 10px; }
  h4 { font-size: 11pt; color: #5C3317; margin: 15px 0 8px; }
  p { margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9pt; }
  th, td { border: 1px solid #C59B5F; padding: 6px 8px; text-align: right; }
  th { background: #C59B5F; color: #fff; font-weight: 700; }
  td { background: #fff; }
  tr:nth-child(even) td { background: #FDF5ED; }
  code { background: #F0EAE1; padding: 1px 5px; border-radius: 3px; font-size: 9pt; direction: ltr; display: inline-block; }
  pre { background: #1C1C1E; color: #F4EFE6; padding: 12px 16px; border-radius: 8px; overflow-x: auto; direction: ltr; text-align: left; font-size: 8pt; line-height: 1.5; margin: 10px 0; }
  pre code { background: none; color: inherit; padding: 0; font-size: inherit; }
  strong { color: #5C3317; }
  hr { border: none; border-top: 1px solid #C59B5F; margin: 30px 0; }
  ul, ol { margin: 8px 0 8px 20px; padding-right: 20px; }
  li { margin-bottom: 4px; }
  blockquote { border-right: 4px solid #C59B5F; padding: 10px 15px; margin: 15px 0; background: #FDF5ED; }
  .page-break { page-break-after: always; }
  @page { margin: 30px 40px; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

writeFileSync('C:\\Users\\MOHAMMED GAMEEL\\baitalmandiwibapp\\docs\\output.html', html, 'utf-8');
console.log('HTML generated. Launching Edge...');

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });

await page.pdf({
  path: pdfPath,
  format: 'A4',
  margin: { top: '30px', bottom: '30px', left: '35px', right: '35px' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:8pt;color:#999;text-align:center;width:100%;padding:5px 0;">بيت المندي — تقرير التدقيق المعماري</div>',
  footerTemplate: '<div style="font-size:8pt;color:#999;text-align:center;width:100%;padding:5px 0;">الصفحة <span class="pageNumber"></span> من <span class="totalPages"></span></div>',
});

await browser.close();
console.log('PDF generated: ' + pdfPath);
