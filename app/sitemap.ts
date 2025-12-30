import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bobby-app.com'
  const lastModified = new Date()

  const locales = ['en', 'pl'] as const

  const publicRoutes = [
    '',
    '/faq',
    '/contact',
    '/privacy-policy',
    '/cookies-policy',
    '/terms-conditions',
    '/safety-privacy',
  ] as const

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const route of publicRoutes) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified,
        changeFrequency: route === '' ? 'weekly' : 'yearly',
        priority: route === '' ? 1 : 0.6,
      })
    }
  }

  return entries
}
