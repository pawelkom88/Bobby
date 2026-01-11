import Image from 'next/image';
import { ROUTES } from '@/lib/routes';
import styles from './global-not-found.module.css';
import Link from 'next/link';

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
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
      <Link className={styles.cartoonBtn} href={ROUTES.HOME}>
        <span> Go home</span>
      </Link>
    </div>
  );
}
