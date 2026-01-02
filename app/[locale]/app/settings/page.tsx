'use client';

import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import AccessibilitySection from '@/components/AccessibilitySection';
import PageWrapper from '@/components/PageWrapper';
import LogoutButton from '@/components/LogoutButton';
import ResetProgressSection from '@/components/ResetProgressSection';
import DeleteAccountSection from '@/components/DeleteAccountSection';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/lib/routes';
import { SpeculationRules } from '@/components/SpeculationRules';

function SettingsPageContent() {
  const t = useTranslations('settings');

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
              aria-labelledby="language-heading"
            >
              <h2 id="language-heading">{t('language.title')}</h2>
              <div className="language-section">
                <LanguageSwitcher />
              </div>
            </section>

            <section
              className="settings-section"
              aria-labelledby="accessibility-heading"
            >
              <AccessibilitySection />
            </section>

            <section
              className="settings-section"
              aria-labelledby="progress-heading"
            >
              <h2 id="progress-heading">{t('progress.title')}</h2>
              <ResetProgressSection />
            </section>

            <section
              className="settings-section"
              aria-labelledby="account-heading"
            >
              <h2 id="account-heading">{t('account.title')}</h2>
              <div className="progress-section">
                <LogoutButton className="cartoon-btn">{t('account.signOut')}</LogoutButton>
                <DeleteAccountSection />
              </div>
            </section>

            <section
              className="settings-section"
              aria-labelledby="about-heading"
            >
              <h2 id="about-heading">{t('about.title')}</h2>
              <p>{t('about.appName')}</p>
              <p>{t('about.version')}</p>
              <Link href={ROUTES.CONTACT} className="contact-link">
                {t('about.contactSupport')}
              </Link>
            </section>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}

export default function SettingsPage() {
  return (
    <>
      <SettingsPageContent />
      <SpeculationRules prefetchPaths={[ROUTES.APP, ROUTES.CHATS, ROUTES.ACHIEVEMENTS]} eagerness="moderate" />
    </>
  );
}
