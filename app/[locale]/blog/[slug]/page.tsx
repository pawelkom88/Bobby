import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticleBySlug, blogArticles } from '../blog-data';
import { articleContentMap } from '../article-content';
import styles from '../Blog.module.css';
import { ViewTransition } from 'react';
import { Link } from '@/i18n/routing';
import { getAbsoluteUrl } from '@/lib/site';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  const title = article.seoTitle ?? `${article.title} | Bobby Blog`;
  const description = article.seoDescription ?? article.excerpt;

  return {
    title,
    description,
    alternates: {
      canonical: getAbsoluteUrl(`/${locale}/blog/${article.slug}`),
    },
    openGraph: {
      title,
      description,
      images: [article.image],
      type: 'article',
      publishedTime: article.publishedAt,
    },
    twitter: {
      title,
      description,
      images: [article.image],
    },
  };
}

export async function generateStaticParams() {
  return blogArticles.map(article => ({
    slug: article.slug,
  }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);
  const articleContent = articleContentMap[slug];
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const nonce = (await headers()).get('x-csp-nonce') ?? undefined;

  if (!article) {
    notFound();
  }

  return (
    <div className={styles.blogContainer}>
      {nonce ? (
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: article.title,
              description: article.excerpt,
              datePublished: article.publishedAt,
              image: [getAbsoluteUrl(article.image)],
              author: {
                '@type': 'Organization',
                name: t('structuredData.authorName'),
              },
              publisher: {
                '@type': 'Organization',
                name: t('structuredData.authorName'),
                logo: {
                  '@type': 'ImageObject',
                  url: getAbsoluteUrl('/bobby-OG-image.png'),
                },
              },
              mainEntityOfPage: getAbsoluteUrl(
                `/${locale}/blog/${article.slug}`
              ),
            }),
          }}
        />
      ) : null}
      <article className={styles.articleContainer}>
        <Link href="/blog" className={styles.backLink}>
          <span aria-hidden="true">←</span>
          <span>Back to Blog</span>
        </Link>
        <br />
        <br />
        <header className={styles.articleHeader}>
          <ViewTransition name={article.title}>
            <h1 className={styles.articleTitle}>{article.title}</h1>
          </ViewTransition>
          <div className={styles.articleMeta}>
            <span>
              Published on{' '}
              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span>{article.readTime}</span>
          </div>
        </header>

        <ViewTransition name={article.slug}>
          <Image
            src={article.image}
            alt={article.title}
            width={800}
            height={400}
            className={styles.articleImage}
            priority
          />
        </ViewTransition>

        <div className={styles.articleContent}>
          {articleContent ?? (
            <>
              <p>
                This is placeholder content for the article &quot;
                {article.title}
                &quot;. In a real implementation, this would contain the full
                article content with proper formatting, images, and detailed
                information.
              </p>

              <h2>Introduction</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>

              <h2>Main Content</h2>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt
                mollit anim id est laborum.
              </p>

              <h3>Key Points</h3>
              <ul>
                <li>Point one about the topic</li>
                <li>Point two with more details</li>
                <li>Point three explaining benefits</li>
              </ul>

              <blockquote>
                &quot;This is an important quote that emphasizes a key point
                about emergency preparedness.&quot;
              </blockquote>

              <h2>Conclusion</h2>
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
                quae ab illo inventore veritatis et quasi architecto beatae
                vitae dicta sunt explicabo.
              </p>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
