import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = BASE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/app/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

// rules: {
//   userAgent: '*',
//     allow: '/',
//     disallow: ['/api/', '/_next/'],
// },
// sitemap: `${baseUrl}/sitemap.xml`,
// }
