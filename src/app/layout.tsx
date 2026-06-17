import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { SettingsProvider } from '@/lib/settings-context';
import { ToastProvider } from '@/components/ui/Toast';
import { OrderRealtimeProvider } from '@/realtime/OrderRealtimeProvider';
import { PwaProvider } from '@/lib/pwa/PwaProvider';

/* ── SEO + PWA Metadata ── */
export const metadata: Metadata = {
  title: {
    default: 'بيت المندي | أصالة الطعم اليمني',
    template: '%s | بيت المندي',
  },
  description:
    'مطعم بيت المندي — تجربة طعام يمنية أصيلة. اطلب أشهى المأكولات من مندي وزربيان ومضبي مع توصيل سريع.',
  keywords: ['بيت المندي', 'مطعم يمني', 'مندي', 'زربيان', 'مضبي', 'صنعاء'],
  authors: [{ name: 'بيت المندي' }],
  robots: 'index, follow',
  manifest: '/manifest.json',
  openGraph: {
    title: 'بيت المندي | أصالة الطعم اليمني',
    description: 'اطلب أشهى المأكولات اليمنية والخليجية.',
    locale: 'ar_YE',
    type: 'website',
  },
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'بيت المندي',
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#1C1C1E' },
    { media: '(prefers-color-scheme: light)', color: '#FAF5EC' },
  ],
};

/* ── Inline script: apply saved theme BEFORE paint to avoid flash ── */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('bam-theme') || 'auto';
    if (t === 'auto') {
      var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Blocking theme script — runs before CSS paint, eliminates flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning style={{ paddingTop: '72px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <PwaProvider>
        <OrderRealtimeProvider>
          <SettingsProvider>
            <ToastProvider>
              <LoadingScreen />
              <Navbar />
              <main style={{ flex: 1 }}>
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </SettingsProvider>
        </OrderRealtimeProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
