'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

export function BeforeFirstCallSection() {
  const t = useTranslations('landing.beforeFirstCall');

  return (
    <section className="before-first-call-section" id="before-first-call">
      <div className="section-container">
        <h2 className="section-title">{t('title')}</h2>
        <p className="section-subtitle">{t('subtitle')}</p>

        <div className="prep-grid">
          <div className="prep-card">
            <div className="prep-icon">
              <Image
                src="/icons/before-start.svg"
                alt={t('beforeStart.title')}
                width={48}
                height={48}
              />
            </div>
            <h3>{t('beforeStart.title')}</h3>
            <ul className="prep-list">
              <li>{t('beforeStart.point1')}</li>
              <li>{t('beforeStart.point2')}</li>
              <li>{t('beforeStart.point3')}</li>
            </ul>
          </div>

          <div className="prep-card">
            <div className="prep-icon">
              <Image
                src="/icons/during-practice.svg"
                alt={t('duringPractice.title')}
                width={48}
                height={48}
              />
            </div>
            <h3>{t('duringPractice.title')}</h3>
            <ul className="prep-list">
              <li>{t('duringPractice.point1')}</li>
              <li>{t('duringPractice.point2')}</li>
              <li>{t('duringPractice.point3')}</li>
            </ul>
          </div>

          <div className="prep-card">
            <div className="prep-icon">
              <Image
                src="/icons/after-call.svg"
                alt={t('afterCall.title')}
                width={48}
                height={48}
              />
            </div>
            <h3>{t('afterCall.title')}</h3>
            <ul className="prep-list">
              <li>{t('afterCall.point1')}</li>
              <li>{t('afterCall.point2')}</li>
              <li>{t('afterCall.point3')}</li>
            </ul>
          </div>
        </div>

        <div className="safety-notice">
          <p>{t('safetyNotice')}</p>
        </div>

        <div className="guide-cta">
          <Link
            href="/parent-guide"
            className="ach-button ach-button-secondary"
          >
            {t('viewGuideButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}
