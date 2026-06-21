import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { SettingsProvider } from '@/lib/settings-context';
import { ToastProvider } from '@/components/ui/Toast';
import { OrderRealtimeProvider } from '@/realtime/OrderRealtimeProvider';
import PWAServiceWorkerRegister from '@/components/pwa/PWAServiceWorkerRegister';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';

const BASE_URL = 'https://baitalmandi.vercel.app';

/* ── SEO Metadata ── */
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'مطعم بيت المندي | بيت الجميع ',
    template: '%s | مطعم بيت المندي',
  },
  description:
    'مطعم بيت المندي يقدم أشهى أطباق المندي والمظبي والمأكولات اليمنية الأصيلة مع خدمة توصيل سريعة داخل صنعاء. اطلب الآن عبر الموقع أو واتساب.',
  keywords: [
    'بيت المندي',
    'مطعم بيت المندي',
    'Bait Al Mandi',
    'Baitalmandi',
    'مطعم مندي',
    'مندي صنعاء',
    'مطعم يمني صنعاء',
    'مطعم مظبي',
    'مطاعم صنعاء',
    'مطعم يمني',
    'مظبي',
    'دجاج مندي',
    'لحم مندي',
    'زربيان',
    'توصيل طعام صنعاء',
    'مأكولات يمنية',
    'مطعم بيت المندي صنعاء',
  ],
  authors: [{ name: 'مطعم بيت المندي', url: BASE_URL }],
  creator: 'مطعم بيت المندي',
  publisher: 'مطعم بيت المندي',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'ar-YE': BASE_URL,
    },
  },
  openGraph: {
    title: 'مطعم بيت المندي | أفضل مطعم مندي في صنعاء',
    description:
      'أشهى أطباق المندي والمظبي والمأكولات اليمنية الأصيلة. خدمة توصيل سريعة لجميع أحياء صنعاء.',
    url: BASE_URL,
    siteName: 'مطعم بيت المندي',
    locale: 'ar_YE',
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/logo.jpg`,
        width: 1200,
        height: 630,
        alt: 'مطعم بيت المندي - أصالة الطعم اليمني',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مطعم بيت المندي | أفضل مطعم مندي في صنعاء',
    description:
      'أشهى أطباق المندي والمظبي والمأكولات اليمنية الأصيلة. خدمة توصيل سريعة لجميع أحياء صنعاء.',
    images: [`${BASE_URL}/logo.jpg`],
  },
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
    shortcut: '/logo.jpg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'بيت المندي',
    statusBarStyle: 'default',
  },
  verification: {
    // Add your Google Search Console verification token here:
    // google: 'YOUR_GOOGLE_VERIFICATION_TOKEN',
  },
  category: 'restaurant',
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

/* ── JSON-LD: Restaurant + LocalBusiness Structured Data ── */
const restaurantSchema = {
  '@context': 'https://schema.org',
  '@type': ['Restaurant', 'LocalBusiness'],
  '@id': `${BASE_URL}/#restaurant`,
  name: 'مطعم بيت المندي',
  alternateName: ['Bait Al Mandi', 'Baitalmandi', 'بيت المندي'],
  description:
    'مطعم بيت المندي يقدم أشهى أطباق المندي والمظبي والمأكولات اليمنية الأصيلة مع خدمة توصيل سريعة داخل صنعاء.',
  url: BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/logo.jpg`,
    width: 400,
    height: 400,
  },
  image: `${BASE_URL}/logo.jpg`,
  telephone: '+967-1-465888',
  priceRange: '$$',
  servesCuisine: ['يمني', 'مندي', 'مظبي', 'زربيان', 'Arabic', 'Yemeni', 'Middle Eastern'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'نهاية شارع الرباط، بداية شارع الستين',
    addressLocality: 'صنعاء',
    addressRegion: 'أمانة العاصمة',
    addressCountry: 'YE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 15.360035,
    longitude: 44.174848,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday',
        'Friday', 'Saturday', 'Sunday',
      ],
      opens: '11:00',
      closes: '00:00',
    },
  ],
  hasMenu: `${BASE_URL}/menu`,
  acceptsReservations: true,
  currenciesAccepted: 'YER',
  paymentAccepted: 'Cash, Digital Wallet',
  areaServed: {
    '@type': 'City',
    name: 'صنعاء',
  },
  sameAs: [
    'https://baitalmandi.vercel.app',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Blocking theme script — runs before CSS paint, eliminates flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* JSON-LD Structured Data — Restaurant + LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
      </head>
      <body suppressHydrationWarning style={{ paddingTop: '72px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <PWAServiceWorkerRegister />
        <PWAInstallPrompt />
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
      </body>
    </html>
  );
}
