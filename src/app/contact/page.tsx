import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'تواصل معنا - أرقام الهاتف والموقع',
  description:
    'تواصل مع مطعم بيت المندي للحجز والتوصيل: اتصل بنا على 01/465888 أو واتساب. موقعنا في صنعاء - نهاية شارع الرباط، بداية شارع الستين.',
  keywords: [
    'تواصل مع بيت المندي',
    'هاتف مطعم بيت المندي',
    'موقع بيت المندي',
    'توصيل بيت المندي',
    'حجز طاولة بيت المندي',
    'واتساب بيت المندي',
  ],
  alternates: {
    canonical: 'https://baitalmandi.vercel.app/contact',
  },
  openGraph: {
    title: 'تواصل معنا | مطعم بيت المندي',
    description:
      'تواصل مع مطعم بيت المندي للحجز والتوصيل. موقعنا: صنعاء - نهاية شارع الرباط، بداية شارع الستين.',
    url: 'https://baitalmandi.vercel.app/contact',
    type: 'website',
    images: [
      {
        url: 'https://baitalmandi.vercel.app/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'تواصل مع مطعم بيت المندي',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تواصل معنا | مطعم بيت المندي',
    description: 'تواصل مع مطعم بيت المندي للحجز والتوصيل في صنعاء.',
    images: ['https://baitalmandi.vercel.app/logo.jpg'],
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
