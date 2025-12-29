'use client';

import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/lib/routes';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';

export default function ContactPage() {
  const t = useTranslations('contact');
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
              aria-labelledby="contact-intro-heading"
            >
              <h2 id="contact-intro-heading" className="sr-only">{t('subtitle')}</h2>
              <p className="contact-subtitle-text">{t('subtitle')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="contact-options-heading"
            >
              <h2 id="contact-options-heading">{t('options.title')}</h2>
              <div className="contact-options-grid">
                <a
                  href="mailto:support@bobby.app"
                  className="contact-option-card"
                  aria-label={t('options.email')}
                >
                  <span className="contact-option-icon" aria-hidden="true">
                    ✉️
                  </span>
                  <span className="contact-option-label">{t('options.email')}</span>
                  <span className="contact-option-desc">support@bobby.app</span>
                </a>

                <Link
                  href={ROUTES.FAQ}
                  className="contact-option-card"
                  aria-label={t('options.faq')}
                >
                  <span className="contact-option-icon" aria-hidden="true">
                    ❓
                  </span>
                  <span className="contact-option-label">{t('options.faq')}</span>
                  <span className="contact-option-desc">{t('options.faqDesc')}</span>
                </Link>
              </div>
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
            <CartoonButton onClick={() => router.push(ROUTES.HOME)}>
              {tCommon('back')}
            </CartoonButton>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}
