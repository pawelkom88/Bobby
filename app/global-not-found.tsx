import Image from 'next/image';
import { getLocale } from 'next-intl/server';
import styles from './global-not-found.module.css';

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
};

export default async function NotFound() {
  const locale = await getLocale();
  const homeHref = `/${locale}`;

  return (
    <div className={styles.planetContainer}>
      <div className={styles.planet}>
        <Image
          className={styles.planetImage}
          src="/bobby-404.webp"
          alt="Bobby 404"
          width={800}
          height={575}
        />
      </div>
      <a className={styles.cartoonBtn} href={homeHref}>
        <span>Go home</span>
      </a>
    </div>
  );
}
