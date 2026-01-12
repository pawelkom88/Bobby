'use client';

import { ViewTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/lib/routes';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';

export default function ContactPage() {
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const homePath = `/${locale}`;
  const supportItems = t.raw('support.items') as string[];
  const detailItems = t.raw('details.items') as string[];

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
              aria-labelledby="contact-intro-heading"
            >
              <h2 id="contact-intro-heading" className="sr-only">
                {t('subtitle')}
              </h2>
              <p className="contact-subtitle-text">{t('subtitle')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="contact-options-heading"
            >
              <h2 id="contact-options-heading">{t('options.title')}</h2>
              <div className="contact-options-grid">
                <a
                  href="mailto:contact@readywithbobby.online"
                  className="contact-option-card"
                  aria-label={t('options.email')}
                >
                  <span className="contact-option-icon" aria-hidden="true">
                    ✉️
                  </span>
                  <span className="contact-option-label">
                    {t('options.email')}
                  </span>
                  <span className="contact-option-desc">
                    contact@readywithbobby.online
                  </span>
                </a>

                <Link
                  href={ROUTES.FAQ}
                  className="contact-option-card"
                  aria-label={t('options.faq')}
                >
                  <span className="contact-option-icon" aria-hidden="true">
                    ❓
                  </span>
                  <span className="contact-option-label">
                    {t('options.faq')}
                  </span>
                  <span className="contact-option-desc">
                    {t('options.faqDesc')}
                  </span>
                </Link>
              </div>
            </section>

            <section
              className="settings-section"
              aria-labelledby="contact-support-heading"
            >
              <h2 id="contact-support-heading" className="settings-section-heading">
                {t('support.title')}
              </h2>
              <p className="mb-3">{t('support.description')}</p>
              <ul className="settings-list space-y-2">
                {supportItems.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="contact-details-heading"
            >
              <h2 id="contact-details-heading" className="settings-section-heading">
                {t('details.title')}
              </h2>
              <p className="mb-3">{t('details.description')}</p>
              <ul className="settings-list space-y-2">
                {detailItems.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mb-3">{t('emergencyNote')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="response-time-heading"
            >
              <h2 id="response-time-heading">{t('responseTimeTitle')}</h2>
              <p>{t('responseTime')}</p>
            </section>
          </div>

          <div className="settings-back-button">
            <CartoonButton asLink href={homePath}>
              {tCommon('back')}
            </CartoonButton>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}
