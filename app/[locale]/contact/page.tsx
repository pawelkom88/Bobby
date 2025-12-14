'use client';

import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export default function ContactPage() {
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');

  return (
    <ViewTransition>
      <main className="contact-page" role="main">
        <header className="contact-header">
          <h1 className="contact-title">{t('title')}</h1>
          <p className="contact-subtitle">
            {t('subtitle')}
          </p>
        </header>

        <div className="contact-options">
          <button
            type="button"
            className="contact-option chat-option"
            aria-label={t('options.chat')}
          >
            <span className="contact-icon" aria-hidden="true">
              💬
            </span>
            <span className="contact-label">{t('options.chat')}</span>
          </button>

          <a
            href="mailto:support@bobby.app"
            className="contact-option email-option"
            aria-label={t('options.email')}
          >
            <span className="contact-icon" aria-hidden="true">
              ✉️
            </span>
            <span className="contact-label">{t('options.email')}</span>
          </a>

          <Link
            href={ROUTES.FAQ}
            className="contact-option faq-option"
            aria-label={t('options.faq')}
          >
            <span className="contact-icon" aria-hidden="true">
              ❓
            </span>
            <span className="contact-label">{t('options.faq')}</span>
          </Link>
        </div>

        <div className="contact-response-time">
          <p>{t('responseTime')}</p>
        </div>

        <nav
          className="contact-navigation"
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
