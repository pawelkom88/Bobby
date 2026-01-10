import Image from 'next/image';
import Link from 'next/link';
import { BlogArticle } from './blog-data';
import styles from './Blog.module.css';

interface BlogCardProps {
  article: BlogArticle;
}

export default function BlogCard({ article }: BlogCardProps) {
  return (
    <Link href={`/blog/${article.slug}`} className={styles.card}>
      <article>
        <div className={styles.imageContainer}>
          <Image
            fill
            src={article.image}
            alt={article.title}
            className={styles.image}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className={styles.content}>
          <h2 className={styles.title}>{article.title}</h2>
          <p className={styles.excerpt}>{article.excerpt}</p>
          <div className={styles.meta}>
            <span className={styles.date}>
              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className={styles.readTime}>{article.readTime}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
