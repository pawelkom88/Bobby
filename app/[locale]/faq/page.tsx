'use client';

import { ViewTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/lib/routes';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';
import FaqAccordion from '@/components/FaqAccordion';

export default function FAQPage() {
  const t = useTranslations('faq');
  const tLanding = useTranslations('landing');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const homePath = `/${locale}`;
  const faqItems = tLanding.raw('faq.items') as Record<
    string,
    { question: string; answer: string }
  >;
  const faqIds = Object.keys(faqItems)
    .map(id => Number(id))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

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
              aria-labelledby="faq-intro-heading"
            >
              <h2 id="faq-intro-heading" className="sr-only">
                {t('subtitle')}
              </h2>
              <p className="faq-subtitle-text">{t('subtitle')}</p>
            </section>

            <section
              className="settings-section faq-accordion-section"
              aria-labelledby="faq-questions-heading"
            >
              <h2 id="faq-questions-heading" className="sr-only">
                {t('questionsTitle')}
              </h2>
              <FaqAccordion
                ids={faqIds}
                getQuestion={id => tLanding(`faq.items.${id}.question`)}
                getAnswer={id => tLanding(`faq.items.${id}.answer`)}
              />
            </section>

            <section
              className="settings-section"
              aria-labelledby="faq-contact-heading"
            >
              <h2 id="faq-contact-heading">{t('stillHaveQuestions')}</h2>
              <p>{t('contactPrompt')}</p>
              <Link href={ROUTES.CONTACT} className="faq-contact-button">
                {t('contactUs')}
              </Link>
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
