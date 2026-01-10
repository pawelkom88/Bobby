import Image from 'next/image';
import Link from 'next/link';
import { blogArticles } from './blog-data';
import BlogCard from './BlogCard';
import styles from './Blog.module.css';

export default function BlogPage() {
  return (
    <div className={styles.blogContainer}>
      <div className={styles.heroSection}>
        <h1 className={styles.pageTitle}>Blog</h1>
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
