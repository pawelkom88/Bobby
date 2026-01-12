import { MetadataRoute } from 'next';
import { blogArticles } from './[locale]/blog/blog-data';
import { locales } from '@/i18n/locales';
import { getAbsoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

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

  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: getAbsoluteUrl(`/${locale}${route.path}`),
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }

    for (const route of articleRoutes) {
      entries.push({
        url: getAbsoluteUrl(`/${locale}${route.path}`),
        lastModified: route.lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  return entries;
}
