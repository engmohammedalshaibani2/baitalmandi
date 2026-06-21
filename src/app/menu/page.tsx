import type { Metadata } from 'next';
import MenuClient from './MenuClient';

export const metadata: Metadata = {
  title: 'قائمة الطعام - مندي ومظبي وأطباق يمنية أصيلة',
  description:
    'تصفح قائمة مطعم بيت المندي الشاملة: مندي دجاج، مندي لحم، مظبي، زربيان، وأشهى الأطباق اليمنية الأصيلة. اطلب الآن مع توصيل سريع لصنعاء.',
  keywords: [
    'قائمة مطعم بيت المندي',
    'مندي دجاج',
    'مندي لحم',
    'مظبي',
    'زربيان',
    'أطباق يمنية',
    'طلب طعام صنعاء',
    'مطعم مندي صنعاء',
    'قائمة طعام يمني',
  ],
  alternates: {
    canonical: 'https://baitalmandi.vercel.app/menu',
  },
  openGraph: {
    title: 'قائمة الطعام | مطعم بيت المندي',
    description:
      'تصفح قائمة مطعم بيت المندي: مندي دجاج، مندي لحم، مظبي، زربيان وأكثر.',
    url: 'https://baitalmandi.vercel.app/menu',
    type: 'website',
    images: [
      {
        url: 'https://baitalmandi.vercel.app/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'قائمة طعام مطعم بيت المندي',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'قائمة الطعام | مطعم بيت المندي',
    description: 'تصفح قائمة مطعم بيت المندي: مندي دجاج، مندي لحم، مظبي، زربيان وأكثر.',
    images: ['https://baitalmandi.vercel.app/logo.jpg'],
  },
};

export default function MenuPage() {
  return <MenuClient />;
}
