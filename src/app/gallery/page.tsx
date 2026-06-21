import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';

export const metadata: Metadata = {
  title: 'معرض الصور - لحظات من عالم بيت المندي',
  description:
    'استعرض معرض صور مطعم بيت المندي وشاهد أشهى الأطباق اليمنية، المندي، المظبي والزربيان في أجمل الصور.',
  keywords: [
    'صور بيت المندي',
    'معرض صور مطعم يمني',
    'صور مندي',
    'صور مطعم صنعاء',
    'غاليري بيت المندي',
  ],
  alternates: {
    canonical: 'https://baitalmandi.vercel.app/gallery',
  },
  openGraph: {
    title: 'معرض الصور | مطعم بيت المندي',
    description: 'استعرض معرض صور مطعم بيت المندي وشاهد أشهى الأطباق اليمنية الأصيلة.',
    url: 'https://baitalmandi.vercel.app/gallery',
    type: 'website',
    images: [
      {
        url: 'https://baitalmandi.vercel.app/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'معرض صور مطعم بيت المندي',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'معرض الصور | مطعم بيت المندي',
    description: 'استعرض معرض صور مطعم بيت المندي وشاهد أشهى الأطباق اليمنية الأصيلة.',
    images: ['https://baitalmandi.vercel.app/logo.jpg'],
  },
};

export default function GalleryPage() {
  return <GalleryClient />;
}
