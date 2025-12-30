'use client';

import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';

export default function TermsConditionsPage() {
  const t = useTranslations('termsConditions');
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
              aria-labelledby="terms-intro-heading"
            >
              <h2 id="terms-intro-heading" className="sr-only">{t('subtitle')}</h2>
              <p className="contact-subtitle-text mb-4">{t('subtitle')}</p>
              <p className="mb-4">{t('lastUpdated', { date: 'December 30, 2024' })}</p>
              <p>{t('intro')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="what-bobby-heading"
            >
              <h2 id="what-bobby-heading" className="text-lg font-semibold mb-3">{t('whatBobbyIs.title')}</h2>
              <p className="mb-3">{t('whatBobbyIs.description')}</p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>{t('whatBobbyIs.bulletPoints.0')}</li>
                <li>{t('whatBobbyIs.bulletPoints.1')}</li>
                <li>{t('whatBobbyIs.bulletPoints.2')}</li>
              </ul>
              <p className="font-semibold text-red-600">{t('whatBobbyIs.emergencyNote')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="who-may-use-heading"
            >
              <h2 id="who-may-use-heading" className="text-lg font-semibold mb-3">{t('whoMayUse.title')}</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('whoMayUse.points.0')}</li>
                <li>{t('whoMayUse.points.1')}</li>
                <li>{t('whoMayUse.points.2')}</li>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="practice-sessions-heading"
            >
              <h2 id="practice-sessions-heading" className="text-lg font-semibold mb-3">{t('practiceSessions.title')}</h2>
              <p className="mb-3">{t('practiceSessions.description')}</p>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('practiceSessions.points.0')}</li>
                <li>{t('practiceSessions.points.1')}</li>
                <li>{t('practiceSessions.points.2')}</li>
                <li>{t('practiceSessions.points.3')}</li>
                <li>{t('practiceSessions.points.4')}</li>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="payments-heading"
            >
              <h2 id="payments-heading" className="text-lg font-semibold mb-3">{t('payments.title')}</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('payments.points.0')}</li>
                <li>{t('payments.points.1')}</li>
                <li>{t('payments.points.2')}</li>
                <li>{t('payments.points.3')}</li>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="no-advice-heading"
            >
              <h2 id="no-advice-heading" className="text-lg font-semibold mb-3">{t('noAdvice.title')}</h2>
              <p className="mb-3">{t('noAdvice.description')}</p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>{t('noAdvice.points.0')}</li>
                <li>{t('noAdvice.points.1')}</li>
                <li>{t('noAdvice.points.2')}</li>
              </ul>
              <p>{t('noAdvice.note')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="availability-heading"
            >
              <h2 id="availability-heading" className="text-lg font-semibold mb-3">{t('availability.title')}</h2>
              <p className="mb-3">{t('availability.description')}</p>
              <ul className="list-disc list-inside space-y-2 mb-3">
                <li>{t('availability.points.0')}</li>
                <li>{t('availability.points.1')}</li>
                <li>{t('availability.points.2')}</li>
              </ul>
              <p>{t('availability.note')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="service-termination-heading"
            >
              <h2 id="service-termination-heading" className="text-lg font-semibold mb-3">{t('serviceTermination.title')}</h2>
              <h3 className="text-md font-semibold mb-2">{t('serviceTermination.voluntary.title')}</h3>
              <p className="mb-4">{t('serviceTermination.voluntary.description')}</p>
              <h3 className="text-md font-semibold mb-2">{t('serviceTermination.insolvency.title')}</h3>
              <p>{t('serviceTermination.insolvency.description')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="liability-heading"
            >
              <h2 id="liability-heading" className="text-lg font-semibold mb-3">{t('liability.title')}</h2>
              <p className="mb-3">{t('liability.description')}</p>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('liability.points.0')}</li>
                <li>{t('liability.points.1')}</li>
                <li>{t('liability.points.2')}</li>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="privacy-heading"
            >
              <h2 id="privacy-heading" className="text-lg font-semibold mb-3">{t('privacy.title')}</h2>
              <p>{t('privacy.description')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="governing-law-heading"
            >
              <h2 id="governing-law-heading" className="text-lg font-semibold mb-3">{t('governingLaw.title')}</h2>
              <p>{t('governingLaw.description')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="contact-heading"
            >
              <h2 id="contact-heading" className="text-lg font-semibold mb-3">{t('contact.title')}</h2>
              <p>{t('contact.description')}</p>
              <p className="font-semibold">{t('contact.email')}</p>
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
