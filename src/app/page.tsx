import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'مطعم بيت المندي | أفضل مطعم مندي ومأكولات يمنية في صنعاء',
  description:
    'مطعم بيت المندي يقدم أشهى أطباق المندي والمظبي والمأكولات اليمنية الأصيلة مع خدمة توصيل سريعة داخل صنعاء. اطلب الآن عبر الموقع أو واتساب.',
  keywords: [
    'بيت المندي',
    'مطعم بيت المندي',
    'Bait Al Mandi',
    'Baitalmandi',
    'بيت المندي صنعاء',
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
  ],
  alternates: {
    canonical: 'https://baitalmandi.vercel.app',
  },
  openGraph: {
    title: 'مطعم بيت المندي | أفضل مطعم مندي في صنعاء',
    description:
      'أشهى أطباق المندي والمظبي والمأكولات اليمنية الأصيلة. خدمة توصيل سريعة لجميع أحياء صنعاء.',
    url: 'https://baitalmandi.vercel.app',
    type: 'website',
    images: [
      {
        url: 'https://baitalmandi.vercel.app/logo.jpg',
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
    images: ['https://baitalmandi.vercel.app/logo.jpg'],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
