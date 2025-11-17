'use client';

import Link from 'next/link';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AppPage() {
  return (
    <PageWrapper>
      <ErrorBoundary>
        <main className="app-page" role="main">
          <div className="welcome-container">
            {/* Header */}
            <div className="welcome-header">
              <h1 className="welcome-title">WELCOME BACK!</h1>
            </div>

            {/* Main Card */}
            <div className="welcome-card">
              {/* Progress Section */}
              <div className="progress-section">
                <div className="progress-left">
                  <p className="progress-label">YOUR PROGRESS</p>
                  <div className="level-progress">
                    <LevelProgress showLabel={true} />
                  </div>
                </div>

                {/* Bobby Character Placeholder */}
                <div className="bobby-placeholder">
                  <div className="bobby-emoji">👤</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <Link
                  href="/app/dial"
                  className="btn btn-primary"
                  aria-label="Start training with Bobby"
                >
                  <span className="btn-icon">📞</span>
                  <span className="btn-text">CALL BOBBY</span>
                </Link>
              </div>

              {/* Badges Section */}
              <div className="badges-section">
                <h2>YOUR BADGES</h2>
                <div className="badges-container">
                  <BadgeDisplay showAll={false} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </ErrorBoundary>
    </PageWrapper>
  );
}
