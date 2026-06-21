import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://baitalmandi.vercel.app';
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/menu`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/my-orders`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
