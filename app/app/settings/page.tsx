'use client';

import { useState } from 'react';
import { ViewTransition } from 'react';
import AccessibilitySection from '@/components/AccessibilitySection';
import CartoonButton from '@/components/CartoonButton';
import PageWrapper from '@/components/PageWrapper';
import LogoutButton from '@/components/LogoutButton';
import { useUserData } from '@/context/UserDataContext';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';

export default function SettingsPage() {
  const { resetProgress } = useUserData();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const handleResetProgress = async () => {
    if (showResetConfirm) {
      try {
        await resetProgress();
        setShowResetConfirm(false);
        setResetConfirmed(true);
      } catch (error) {
        logger.error('Error resetting progress:', error);
      }
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
              {!showResetConfirm ? (
                <div className="progress-section">
                  <p>Reset all progress, badges, and conversation history.</p>
                  <CartoonButton
                    onClick={handleResetProgress}
                    ariaLabel="Reset progress"
                    className="cartoon-btn-danger"
                  >
                    💣 Reset Progress
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
                    Are you sure you want to reset all progress? This cannot be
                    undone.
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
            </section>

            <section
              className="settings-section"
              aria-labelledby="account-heading"
            >
              <h2 id="account-heading">Account</h2>
              <div className="progress-section">
                <LogoutButton className="cartoon-btn">← Sign Out</LogoutButton>
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
