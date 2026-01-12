import { MetadataRoute } from 'next';
import { blogArticles } from './[locale]/blog/blog-data';
import { locales } from '@/i18n/locales';
import { BASE_URL } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const baseUrl = BASE_URL.replace(/\/$/, '');
  const supportedLocales = locales.length > 0 ? locales : (['en'] as const);
  const buildUrl = (path: string) =>
    `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const staticRoutes = [
    { path: '', changeFrequency: 'weekly', priority: 1 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/parent-guide', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/faq', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/cookies-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms-conditions', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/safety-privacy', changeFrequency: 'yearly', priority: 0.5 },
  ] as const;

  const articleRoutes = blogArticles.map(article => ({
    path: `/blog/${article.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    lastModified: new Date(article.publishedAt),
  }));

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of supportedLocales) {
    for (const route of staticRoutes) {
      entries.push({
        url: buildUrl(`/${locale}${route.path}`),
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }

    for (const route of articleRoutes) {
      entries.push({
        url: buildUrl(`/${locale}${route.path}`),
        lastModified: route.lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  return entries;
}
