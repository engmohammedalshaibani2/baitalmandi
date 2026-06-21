import type { Metadata } from 'next';
import MyOrdersClient from './MyOrdersClient';

export const metadata: Metadata = {
  title: 'إتمام الطلب - اطلب من مطعم بيت المندي',
  description:
    'أتمم طلبك من مطعم بيت المندي بسهولة. خدمة توصيل سريعة لجميع أحياء صنعاء مع إمكانية الدفع نقداً أو عبر المحافظ الإلكترونية.',
  keywords: [
    'طلب توصيل بيت المندي',
    'طلب طعام صنعاء',
    'توصيل مندي',
    'توصيل طعام يمني',
    'اطلب من بيت المندي',
  ],
  alternates: {
    canonical: 'https://baitalmandi.vercel.app/my-orders',
  },
  robots: {
    index: false, // Checkout page — no value in indexing
    follow: false,
  },
};

export default function MyOrdersPage() {
  return <MyOrdersClient />;
}
