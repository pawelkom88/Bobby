'use client';

import { useState } from 'react';
import Link from 'next/link';
import AccessibilityControls from '@/components/AccessibilityControls';
import { resetProgress } from '@/lib/storage';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetProgress = () => {
    if (showResetConfirm) {
      resetProgress();
      setShowResetConfirm(false);
      // Redirect to home after reset
      router.push('/');
    } else {
      setShowResetConfirm(true);
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <main className="settings-page" role="main">
      <header className="settings-header">
        <h1 className="settings-title">SETTINGS</h1>
      </header>

      <div className="settings-content">
        <section className="settings-section" aria-labelledby="accessibility-heading">
          <h2 id="accessibility-heading">Accessibility</h2>
          <AccessibilityControls />
        </section>

        <section className="settings-section" aria-labelledby="progress-heading">
          <h2 id="progress-heading">Progress</h2>
          <div className="reset-progress-section">
            {!showResetConfirm ? (
              <>
                <p>Reset all progress, badges, and conversation history.</p>
                <button
                  type="button"
                  className="reset-button"
                  onClick={handleResetProgress}
                  aria-label="Reset progress"
                >
                  Reset Progress
                </button>
              </>
            ) : (
              <>
                <p className="reset-warning" role="alert">
                  Are you sure you want to reset all progress? This cannot be undone.
                </p>
                <div className="reset-actions">
                  <button
                    type="button"
                    className="confirm-reset-button"
                    onClick={handleResetProgress}
                    aria-label="Confirm reset progress"
                  >
                    Yes, Reset Everything
                  </button>
                  <button
                    type="button"
                    className="cancel-reset-button"
                    onClick={handleCancelReset}
                    aria-label="Cancel reset"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="settings-section" aria-labelledby="about-heading">
          <h2 id="about-heading">About</h2>
          <p>Bobby - Emergency Training for Kids</p>
          <p>Version 1.0.0</p>
          <Link href="/contact" className="contact-link">
            Contact Support
          </Link>
        </section>
      </div>

      <nav className="settings-navigation" role="navigation" aria-label="Main navigation">
        <Link href="/" className="nav-link">
          Home
        </Link>
        <Link href="/app" className="nav-link">
          Scenarios
        </Link>
        <Link href="/settings" className="nav-link" aria-current="page">
          Settings
        </Link>
      </nav>
    </main>
  );
}

