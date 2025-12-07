'use client';

import { ViewTransition } from 'react';
import AccessibilitySection from '@/components/AccessibilitySection';
import PageWrapper from '@/components/PageWrapper';
import LogoutButton from '@/components/LogoutButton';
import ResetProgressSection from '@/components/ResetProgressSection';
import DeleteAccountSection from '@/components/DeleteAccountSection';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export default function SettingsPage() {
  return (
    <ViewTransition>
      <PageWrapper>
        <main className="settings-page" role="main">
          <header className="settings-header">
            <h1 className="settings-title">SETTINGS</h1>
          </header>
          <div className="settings-content">
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
              <h2 id="progress-heading">Progress</h2>
              <ResetProgressSection />
            </section>

            <section
              className="settings-section"
              aria-labelledby="account-heading"
            >
              <h2 id="account-heading">Account</h2>
              <div className="progress-section">
                <LogoutButton className="cartoon-btn">← Sign Out</LogoutButton>
                <DeleteAccountSection />
              </div>
            </section>

            <section
              className="settings-section"
              aria-labelledby="about-heading"
            >
              <h2 id="about-heading">About</h2>
              <p>Bobby - Emergency Training for Kids</p>
              <p>Version 1.0.0</p>
              <Link href={ROUTES.CONTACT} className="contact-link">
                Contact Support
              </Link>
            </section>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}
