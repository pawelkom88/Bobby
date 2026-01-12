import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bobby-app.com';

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
