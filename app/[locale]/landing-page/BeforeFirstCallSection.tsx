'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import styles from './BeforeFirstCallSection.module.css';
import landingPageStyles from '../LandingPage.module.css';

export function BeforeFirstCallSection() {
  const t = useTranslations('landing.beforeFirstCall');

  return (
    <section className={styles.section} id="before-first-call">
      <div className={styles.container}>
        <h2 className={styles.title}>{t('title')}</h2>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <div className={styles.prepGrid}>
          <div className={styles.prepCard}>
            <div className={styles.prepIcon}>
              <Image
                loading="lazy"
                src="/new-icons1.webp"
                alt={t('beforeStart.title')}
                width={120}
                height={120}
              />
            </div>
            <h3>{t('beforeStart.title')}</h3>
            <ul className={styles.prepList}>
              <li className={styles.prepListItem}>{t('beforeStart.point1')}</li>
              <li className={styles.prepListItem}>{t('beforeStart.point2')}</li>
              <li className={styles.prepListItem}>{t('beforeStart.point3')}</li>
            </ul>
          </div>

          <div className={styles.prepCard}>
            <div className={styles.prepIcon}>
              <Image
                loading="lazy"
                src="/new-icons2.webp"
                alt={t('duringPractice.title')}
                width={120}
                height={120}
              />
            </div>
            <h3>{t('duringPractice.title')}</h3>
            <ul className={styles.prepList}>
              <li className={styles.prepListItem}>{t('duringPractice.point1')}</li>
              <li className={styles.prepListItem}>{t('duringPractice.point2')}</li>
              <li className={styles.prepListItem}>{t('duringPractice.point3')}</li>
            </ul>
          </div>

          <div className={styles.prepCard}>
            <div className={styles.prepIcon}>
              <Image
                loading="lazy"
                src="/new-icons3.webp"
                alt={t('afterCall.title')}
                width={120}
                height={120}
              />
            </div>
            <h3>{t('afterCall.title')}</h3>
            <ul className={styles.prepList}>
              <li className={styles.prepListItem}>{t('afterCall.point1')}</li>
              <li className={styles.prepListItem}>{t('afterCall.point2')}</li>
              <li className={styles.prepListItem}>{t('afterCall.point3')}</li>
            </ul>
          </div>
        </div>

        <div className={styles.safetyNotice}>
          <p>{t('safetyNotice')}</p>
        </div>

        <div className={styles.guideCta}>
          <Link
            href="/parent-guide"
            className={`ach-button ${landingPageStyles.achButtonLanding}`}
          >
            {t('viewGuideButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}
