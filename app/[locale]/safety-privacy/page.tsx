'use client';

import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';

export default function SafetyPrivacyPage() {
  const t = useTranslations('safetyPrivacy');
  const tCommon = useTranslations('common');
  const router = useRouter();

  return (
    <ViewTransition>
      <PageWrapper>
        <main className="settings-page" role="main">
          <header className="settings-header">
            <h1 className="settings-title">{t('title')}</h1>
          </header>

          <div className="settings-content">
            <section
              className="settings-section"
              aria-labelledby="safety-intro-heading"
            >
              <h2 id="safety-intro-heading" className="sr-only">
                {t('subtitle')}
              </h2>
              <p className="contact-subtitle-text">{t('subtitle')}</p>
              <p>{t('intro')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="how-we-protect-heading"
            >
              <h2
                id="how-we-protect-heading"
                className="settings-section-heading"
              >
                {t('howWeProtect.title')}
              </h2>
              <ul className="settings-list">
                <li>{t('howWeProtect.points.0')}</li>
                <li>{t('howWeProtect.points.1')}</li>
                <li>{t('howWeProtect.points.2')}</li>
                <li>{t('howWeProtect.points.3')}</li>
                <li>{t('howWeProtect.points.4')}</li>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="parental-guidance-heading"
            >
              <h2
                id="parental-guidance-heading"
                className="settings-section-heading"
              >
                {t('parentalGuidance.title')}
              </h2>
              <ul className="settings-list">
                <li>{t('parentalGuidance.points.0')}</li>
                <li>{t('parentalGuidance.points.1')}</li>
                <li>{t('parentalGuidance.points.2')}</li>
                <li>{t('parentalGuidance.points.3')}</li>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="what-to-teach-heading"
            >
              <h2
                id="what-to-teach-heading"
                className="settings-section-heading"
              >
                {t('whatToTeach.title')}
              </h2>
              <ul className="settings-list">
                <li>{t('whatToTeach.points.0')}</li>
                <li>{t('whatToTeach.points.1')}</li>
                <li>{t('whatToTeach.points.2')}</li>
                <li>{t('whatToTeach.points.3')}</li>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="best-practices-heading"
            >
              <h2
                id="best-practices-heading"
                className="settings-section-heading"
              >
                {t('bestPractices.title')}
              </h2>
              <ul className="settings-list">
                <li>{t('bestPractices.points.0')}</li>
                <li>{t('bestPractices.points.1')}</li>
                <li>{t('bestPractices.points.2')}</li>
                <li>{t('bestPractices.points.3')}</li>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="privacy-details-heading"
            >
              <h2
                id="privacy-details-heading"
                className="settings-section-heading"
              >
                {t('privacyDetails.title')}
              </h2>
              <p>{t('privacyDetails.description')}</p>
              <div>
                <Link
                  href="/privacy-policy"
                  className="policy-link"
                >
                  {t('privacyDetails.privacyPolicy')}
                </Link>
                <Link
                  href="/cookies-policy"
                  className="policy-link"
                >
                  {t('privacyDetails.cookiesPolicy')}
                </Link>
              </div>
            </section>

            <section
              className="settings-section"
              aria-labelledby="contact-heading"
            >
              <h2 id="contact-heading" className="text-lg font-semibold mb-3">
                {t('contact.title')}
              </h2>
              <p>{t('contact.description')}</p>
              <p className="font-bold">{t('contact.email')}</p>
            </section>
          </div>

          <div className="settings-back-button">
            <CartoonButton onClick={() => router.push('/')}>
              {tCommon('back')}
            </CartoonButton>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}
