'use client';

import { useState } from 'react';
import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQ_IDS = [1, 2, 3, 4, 5];

export default function FAQPage() {
  const t = useTranslations('faq');
  const tCommon = useTranslations('common');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleQuestion = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ViewTransition>
      <main className="faq-page" role="main">
        <header className="faq-header">
          <h1 className="faq-title">{t('title')}</h1>
          <p className="faq-subtitle">{t('subtitle')}</p>
        </header>

        <div className="faq-list" role="list">
          {FAQ_IDS.map(id => (
            <div key={id} className="faq-item" role="listitem">
              <button
                type="button"
                className="faq-question"
                onClick={() => toggleQuestion(id)}
                aria-expanded={expandedId === id}
                aria-controls={`faq-answer-${id}`}
              >
                <span className="faq-question-text">{t(`items.${id}.question`)}</span>
                <span className="faq-toggle" aria-hidden="true">
                  {expandedId === id ? '▼' : '▶'}
                </span>
              </button>
              {expandedId === id && (
                <div
                  id={`faq-answer-${id}`}
                  className="faq-answer"
                  role="region"
                  aria-live="polite"
                >
                  <p>{t(`items.${id}.answer`)}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-contact">
          <p>{t('stillHaveQuestions')}</p>
          <Link href={ROUTES.CONTACT} className="contact-link">
            {t('contactUs')}
          </Link>
        </div>

        <nav
          className="faq-navigation"
          role="navigation"
          aria-label="Main navigation"
        >
          <Link href={ROUTES.HOME} className="nav-link">
            {tCommon('home')}
          </Link>
          <Link href={ROUTES.APP} className="nav-link">
            {tCommon('scenarios')}
          </Link>
          <Link href={ROUTES.SETTINGS} className="nav-link">
            {tCommon('settings')}
          </Link>
        </nav>
      </main>
    </ViewTransition>
  );
}
