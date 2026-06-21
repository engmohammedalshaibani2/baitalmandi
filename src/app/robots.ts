import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/_next/'],
      },
      {
        // Allow Googlebot full access to public pages
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/_next/'],
      },
    ],
    sitemap: 'https://baitalmandi.vercel.app/sitemap.xml',
    host: 'https://baitalmandi.vercel.app',
  };
}
