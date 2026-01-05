'use client';

import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';

export default function CookiesPolicyPage() {
  const t = useTranslations('cookiesPolicy');
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
              aria-labelledby="cookies-intro-heading"
            >
              <h2 id="cookies-intro-heading" className="sr-only">
                {t('subtitle')}
              </h2>
              <p className="mb-4">
                {t('lastUpdated', { date: 'December 30, 2024' })}
              </p>
              <p>{t('intro')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="what-are-cookies-heading"
            >
              <h2
                id="what-are-cookies-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('whatAreCookies.title')}
              </h2>
              <p>{t('whatAreCookies.description')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="how-we-use-heading"
            >
              <h2
                id="how-we-use-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('howWeUse.title')}
              </h2>
              <p className="mb-3">{t('howWeUse.description')}</p>
              
              {/* Essential Cookies */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">{t('howWeUse.essentialTitle')}</h3>
                <p className="mb-2">{t('howWeUse.essentialDescription')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('howWeUse.essentialPoints.0')}</li>
                  <li>{t('howWeUse.essentialPoints.1')}</li>
                  <li>{t('howWeUse.essentialPoints.2')}</li>
                  <li>{t('howWeUse.essentialPoints.3')}</li>
                </ul>
              </div>
              
              {/* Analytics Cookies */}
              <div>
                <h3 className="font-semibold mb-2">{t('howWeUse.analyticsTitle')}</h3>
                <p className="mb-2">{t('howWeUse.analyticsDescription')}</p>
                <p className="text-sm text-gray-600 italic">{t('howWeUse.analyticsNote')}</p>
              </div>
            </section>

            <section
              className="settings-section"
              aria-labelledby="what-we-dont-use-heading"
            >
              <h2
                id="what-we-dont-use-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('whatWeDontUse.title')}
              </h2>
              <p className="mb-3">{t('whatWeDontUse.description')}</p>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('whatWeDontUse.points.0')}</li>
                <li>{t('whatWeDontUse.points.1')}</li>
                <li>{t('whatWeDontUse.points.2')}</li>
                <li>{t('whatWeDontUse.points.3')}</li>
              </ul>
            </section>

            {/* Analytics cookies section - commented out for future use */}
            {/* <section
              className="settings-section"
              aria-labelledby="analytics-cookies-heading"
            >
              <h2 id="analytics-cookies-heading" className="text-lg font-semibold mb-3">{t('analyticsCookies.title')}</h2>
              <p className="mb-3">{t('analyticsCookies.description')}</p>
              <p className="mb-3">{t('analyticsCookies.subTitle')}</p>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('analyticsCookies.points.0')}</li>
                <li>{t('analyticsCookies.points.1')}</li>
                <li>{t('analyticsCookies.points.2')}</li>
              </ul>
              <p>{t('analyticsCookies.example')}</p>
            </section> */}

            <section
              className="settings-section"
              aria-labelledby="managing-heading"
            >
              <h2 id="managing-heading" className="text-lg font-semibold mb-3">
                {t('managing.title')}
              </h2>
              <p className="mb-3">{t('managing.description')}</p>
              <p className="text-sm text-gray-600">{t('managing.browserNote')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="changes-heading"
            >
              <h2 id="changes-heading" className="text-lg font-semibold mb-3">
                {t('changes.title')}
              </h2>
              <p>{t('changes.description')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="contact-heading"
            >
              <h2 id="contact-heading" className="text-lg font-semibold mb-3">
                {t('contact.title')}
              </h2>
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
