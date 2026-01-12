export interface BlogArticle {
  slug: string; // SEO-friendly URL slug
  title: string;
  excerpt: string; // Truncated preview text
  seoTitle?: string;
  seoDescription?: string;
  image: string; // Image path in public folder
  publishedAt: string; // ISO date string
  readTime: string; // e.g., "5 min read"
}

export const blogArticles: BlogArticle[] = [
  {
    slug: 'teaching-children-emergency-calls',
    title:
      'How to Teach Kids Emergency Response Skills Through Interactive Technology',
    excerpt:
      'Learn the best approaches for preparing your child to handle emergency situations with confidence. Discover age-appropriate strategies, role-playing techniques, and practical tips for building emergency readiness skills.',
    seoTitle: 'Teach Kids Emergency Calls: Interactive Practice | Bobby',
    seoDescription:
      'Practical ways to help kids stay calm on 999/112 calls, with scripts, drills, and kid-safe practice using Bobby.',
    image: '/blog.webp',
    publishedAt: '2025-01-10',
    readTime: '5 min read',
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find(article => article.slug === slug);
}
