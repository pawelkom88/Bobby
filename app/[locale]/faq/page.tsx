'use client';

import { useState } from 'react';
import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/lib/routes';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';

const FAQ_CATEGORIES = {
  'getting-started': {
    title: 'Getting Started',
    ids: [1, 2, 3, 4]
  },
  'payments': {
    title: 'Payments & Credits',
    ids: [5, 6, 7, 8, 9]
  },
  'technical': {
    title: 'Technical Requirements',
    ids: [10, 11]
  },
  'privacy': {
    title: 'Privacy & Safety',
    ids: [12, 13]
  },
  'learning': {
    title: 'Learning & Progress',
    ids: [14, 15, 16, 17]
  },
  'accessibility': {
    title: 'Accessibility',
    ids: [18, 19]
  },
  'account': {
    title: 'Account Management',
    ids: [20, 21, 22, 23]
  },
  'troubleshooting': {
    title: 'Troubleshooting',
    ids: [24, 25]
  }
};

export default function FAQPage() {
  const t = useTranslations('faq');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleQuestion = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
              {Object.entries(FAQ_CATEGORIES).map(([categoryKey, category]) => (
                <div key={categoryKey} className="faq-category">
                  <h3 className="faq-category-title">{category.title}</h3>
                  <div className="faq-accordion" role="list">
                    {category.ids.map(id => (
                      <div
                        key={id}
                        className={`faq-accordion-item ${expandedId === id ? 'expanded' : ''}`}
                        role="listitem"
                      >
                        <button
                          type="button"
                          className="faq-accordion-trigger"
                          onClick={() => toggleQuestion(id)}
                          aria-expanded={expandedId === id}
                          aria-controls={`faq-answer-${id}`}
                        >
                          <span className="faq-accordion-question">
                            {t(`items.${id}.question`)}
                          </span>
                          <span className="faq-accordion-icon" aria-hidden="true">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="black"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m9 6 6 6-6 6" />
                            </svg>
                          </span>
                        </button>
                        <div
                          id={`faq-answer-${id}`}
                          className="faq-accordion-content"
                          role="region"
                          aria-labelledby={`faq-question-${id}`}
                          hidden={expandedId !== id}
                        >
                          <p>{t(`items.${id}.answer`)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
            <CartoonButton onClick={() => router.push(ROUTES.HOME)}>
              {tCommon('back')}
            </CartoonButton>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}
