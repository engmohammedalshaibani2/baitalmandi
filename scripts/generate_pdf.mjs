import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { marked } from 'marked';

const docsDir = path.resolve('docs');
const outputPdfPath = path.resolve('baitalmandi.pdf');

// ترتيب الملفات ليكون الفهرس منطقياً
const filesOrder = [
  'Executive_Summary.md',
  'Project_Structure_Documentation.md',
  'Architecture_Documentation.md',
  'Database_Documentation.md',
  'Security_Documentation.md',
  'Orders_System_Documentation.md',
  'Delivery_System_Documentation.md',
  'Admin_System_Documentation.md',
  'Reports_System_Documentation.md',
  'Quality_Assessment.md',
  'SEO_Assessment.md',
  'Final_Architecture_Report.md'
];

async function generatePDF() {
  console.log('Reading Markdown files...');
  let combinedMarkdown = '';
  
  // الغلاف
  const logoPath = path.resolve('public/Esnaad Tech Logo.svg');
  let logoBase64 = '';
  if (fs.existsSync(logoPath)) {
    const logoData = fs.readFileSync(logoPath);
    logoBase64 = `data:image/svg+xml;base64,${logoData.toString('base64')}`;
  }

  for (const file of filesOrder) {
    const filePath = path.join(docsDir, file);
    if (fs.existsSync(filePath)) {
      combinedMarkdown += `\n\n<div class="page-break"></div>\n\n` + fs.readFileSync(filePath, 'utf8');
    }
  }

  // إضافة المراجع التقنية
  combinedMarkdown += `
<div class="page-break"></div>

# المراجع التقنية
- توثيق Next.js الرسمي: https://nextjs.org/docs
- توثيق Supabase: https://supabase.com/docs
- توثيق Drizzle ORM: https://orm.drizzle.team/docs/overview
- خوارزمية Haversine: https://en.wikipedia.org/wiki/Haversine_formula
- خدمة OSRM للتوجيه: http://project-osrm.org/
`;

  // Custom renderer لـ Mermaid
  const renderer = new marked.Renderer();
  const originalCode = renderer.code.bind(renderer);
  renderer.code = function (code, language, isEscaped) {
    if (language === 'mermaid') {
      return `<div class="mermaid">\n${code}\n</div>`;
    }
    return originalCode(code, language, isEscaped);
  };
  marked.setOptions({ renderer });

  let htmlContent = marked.parse(combinedMarkdown);

  // إعداد القالب النهائي (HTML + CSS)
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>توثيق مشروع بيت المندي</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
    
    :root {
      --gold: #D4AF37;
      --gold-dark: #B5952F;
      --dark: #1C1C1E;
      --gray: #F5F5F5;
      --text: #333333;
    }
    
    body {
      font-family: 'Tajawal', sans-serif;
      color: var(--text);
      line-height: 1.8;
      font-size: 14px;
      margin: 0;
      padding: 0;
      background: white;
    }

    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: var(--dark);
      color: white;
      padding: 50px;
      box-sizing: border-box;
    }

    .cover-page img {
      max-width: 300px;
      margin-bottom: 40px;
    }

    .cover-page h1 {
      color: var(--gold);
      font-size: 48px;
      margin-bottom: 20px;
      font-weight: 800;
    }

    .cover-page h2 {
      font-size: 24px;
      color: #E0E0E0;
      margin-bottom: 60px;
      font-weight: 400;
    }

    .cover-page .company {
      font-size: 20px;
      color: var(--gold);
      margin-top: auto;
    }

    h1, h2, h3, h4, h5, h6 {
      color: var(--dark);
      font-weight: 700;
      page-break-after: avoid;
    }

    h1 {
      font-size: 28px;
      border-bottom: 2px solid var(--gold);
      padding-bottom: 10px;
      margin-top: 40px;
      color: var(--gold-dark);
    }

    h2 { font-size: 22px; margin-top: 30px; }
    h3 { font-size: 18px; margin-top: 20px; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: right;
    }

    th {
      background-color: var(--gold);
      color: white;
    }

    tr:nth-child(even) { background-color: var(--gray); }

    pre {
      background: var(--gray);
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      direction: ltr;
      text-align: left;
      border-left: 4px solid var(--gold);
      page-break-inside: avoid;
    }

    code {
      font-family: monospace;
      color: #d63384;
    }

    .mermaid {
      background: var(--gray);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .page-break {
      page-break-before: always;
    }

    @page {
      margin: 20mm;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</head>
<body>

  <div class="cover-page">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Esnaad Tech Logo">` : ''}
    <h1>توثيق مشروع بيت المندي</h1>
    <h2>الوثيقة التقنية والمعمارية الشاملة</h2>
    <div class="company">تطوير وإنتاج: Esnaad Tech <br> يونيو 2026</div>
  </div>

  <div class="content">
    ${htmlContent}
  </div>

</body>
</html>
  `;

  const tempHtmlPath = path.join(docsDir, 'temp.html');
  fs.writeFileSync(tempHtmlPath, htmlTemplate);
  console.log('Generated temp HTML at', tempHtmlPath);

  // إيجاد متصفح Chrome/Edge محلي
  const executablePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  let executablePath = null;
  for (const ep of executablePaths) {
    if (fs.existsSync(ep)) {
      executablePath = ep;
      break;
    }
  }

  if (!executablePath) {
    throw new Error('لم يتم العثور على متصفح Chrome أو Edge في المسارات الافتراضية.');
  }

  console.log('Launching browser using:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new'
  });

  const page = await browser.newPage();
  
  // وضع المحتوى داخل المتصفح للرسم
  await page.goto('file://' + tempHtmlPath.replace(/\\\\/g, '/'), { waitUntil: 'networkidle0' });

  // الانتظار حتى يرسم Mermaid
  try {
    await page.waitForSelector('.mermaid svg', { timeout: 10000 });
  } catch (e) {
    console.log('Mermaid timeout or no diagrams found.');
  }

  console.log('Generating PDF...');
  
  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div style='font-size: 10px; width: 100%; text-align: center; color: #888; font-family: Tajawal, sans-serif;'>توثيق مشروع بيت المندي - Esnaad Tech</div>",
    footerTemplate: "<div style='font-size: 10px; width: 100%; display: flex; justify-content: space-between; padding: 0 40px; color: #888; font-family: Tajawal, sans-serif;'><span></span><span>الصفحة <span class='pageNumber'></span> من <span class='totalPages'></span></span></div>",
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '20mm',
      right: '20mm'
    }
  });

  await browser.close();
  console.log('PDF generated successfully at', outputPdfPath);
  
  // Cleanup
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
}

generatePDF().catch(console.error);
