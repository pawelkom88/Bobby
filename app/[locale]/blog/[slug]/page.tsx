import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleBySlug, blogArticles } from '../blog-data';
import { articleContentMap } from '../article-content';
import styles from '../Blog.module.css';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} | Bobby Blog`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.image],
      type: 'article',
      publishedTime: article.publishedAt,
    },
  };
}

export async function generateStaticParams() {
  return blogArticles.map(article => ({
    slug: article.slug,
  }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  const articleContent = articleContentMap[slug];

  if (!article) {
    notFound();
  }

  return (
    <div className={styles.blogContainer}>
      <article className={styles.articleContainer}>
        <Link href="/blog" className={styles.backLink}>
          <span aria-hidden="true">←</span>
          <span>Back to Blog</span>
        </Link>
        <br />
        <br />
        <header className={styles.articleHeader}>
          <h1 className={styles.articleTitle}>{article.title}</h1>
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

        <Image
          src={article.image}
          alt={article.title}
          width={800}
          height={400}
          className={styles.articleImage}
          priority
        />

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
