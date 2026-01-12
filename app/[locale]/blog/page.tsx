import Image from 'next/image';
import type { Metadata } from 'next';
import { blogArticles } from './blog-data';
import BlogCard from './BlogCard';
import styles from './Blog.module.css';
import { Link } from '@/i18n/routing';
import { getPageMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getPageMetadata({
    locale,
    pageKey: 'blog',
    pathname: `/${locale}/blog`,
  });
}

export default async function BlogPage() {
  const t = await getTranslations('blog');
  const topics = t.raw('topics') as string[];

  return (
    <div className={styles.blogContainer}>
      <div className={styles.heroSection}>
        <h1 className={styles.pageTitle}>{t('title')}</h1>
        <Image
          src="/blog1.webp"
          alt="Blog"
          width={800}
          height={400}
          className={styles.heroImage}
          priority
        />
        <br />
        <Link href="/" className={styles.backLink}>
          <span aria-hidden="true">←</span>
          <span>Back to Home</span>
        </Link>
        <br />
        <div className={styles.heroCallout}>
          <p className={styles.heroQuote}>
            “Grab a juice box, sharpen your crayons, and let’s swap stories
            about raising calm little heroes.”
          </p>
          <ul className={styles.heroBadges}>
            <li>Kid-tested wisdom</li>
            <li>Playful prep ideas</li>
            <li> Calm-in-a-crisis tips</li>
          </ul>
        </div>
        <div className={styles.heroIntro}>
          <p className={styles.heroIntroText}>{t('intro')}</p>
          <p className={styles.heroIntroText}>{t('summary')}</p>
        </div>
        <div className={styles.heroHighlights}>
          <h2 className={styles.heroHighlightsTitle}>{t('topicsTitle')}</h2>
          <ul className={styles.heroHighlightsList}>
            {topics.map(topic => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </div>
        <p className={styles.heroFooterText}>{t('cta')}</p>
        <br />
      </div>

      <div className={styles.cardGrid}>
        {blogArticles.map(article => (
          <BlogCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
