'use client';

import { useState } from 'react';
import { ViewTransition } from 'react';
import AccessibilitySection from '@/components/AccessibilitySection';
import CartoonButton from '@/components/CartoonButton';
import PageWrapper from '@/components/PageWrapper';
import { resetProgress } from '@/lib/storage';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export default function SettingsPage() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const handleResetProgress = () => {
    if (showResetConfirm) {
      resetProgress();
      setShowResetConfirm(false);
      setResetConfirmed(true);
    } else {
      setShowResetConfirm(true);
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

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
              <div className="reset-progress-section">
                {!showResetConfirm ? (
                  <div>
                    <p>Reset all progress, badges, and conversation history.</p>
                    <CartoonButton
                      onClick={handleResetProgress}
                      ariaLabel="Reset progress"
                      className="cartoon-btn-danger"
                    >
                      Reset Progress
                    </CartoonButton>
                    {resetConfirmed && (
                      <p className="reset-confirmation" role="alert">
                        Progress reset successfully.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="reset-warning" role="alert">
                      Are you sure you want to reset all progress? This cannot
                      be undone.
                    </p>
                    <div className="reset-actions">
                      <CartoonButton
                        onClick={handleResetProgress}
                        ariaLabel="Confirm reset progress"
                        className="cartoon-btn-danger"
                      >
                        Yes, Reset Everything
                      </CartoonButton>
                      <CartoonButton
                        onClick={handleCancelReset}
                        ariaLabel="Cancel reset"
                      >
                        Cancel
                      </CartoonButton>
                    </div>
                  </>
                )}
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
