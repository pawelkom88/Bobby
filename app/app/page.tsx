'use client';

import { useEffect } from 'react';
import BadgeDisplay from '@/components/BadgeDisplay';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CartoonButton from '@/components/CartoonButton';
import { ViewTransition } from 'react';
import AnimatedImageWrapper from '@/components/AnimatedImageWrapper';
import { ROUTES } from '@/lib/routes';

export default function AppPage() {
  // Clear any leftover session data when landing on home page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('conversationComplete');
      sessionStorage.removeItem('lastAssessment');
      sessionStorage.removeItem('completionId');
      sessionStorage.removeItem('processedCompletionId');
    }
  }, []);

  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <main className="app-page" role="main">
            <div className="welcome-container">
              <div className="welcome-card">
                <div>
                  <h1 className="welcome-title">WELCOME</h1>
                  <p className="welcome-subtitle">Hi, I am Bobby, your guide</p>
                </div>
                <AnimatedImageWrapper
                  src="/bobby.png"
                  alt="Bobby"
                  width={300}
                  height={300}
                  className="welcome-image"
                />
                <CartoonButton
                  containerClassName="welcome-button"
                  asLink
                  href={ROUTES.YOUR_AGE}
                >
                  CALL BOBBY
                </CartoonButton>
                <div className="badges-section">
                  <h2 className="badges-title">YOUR BADGES</h2>
                  <div className="badges-container">
                    <BadgeDisplay showAll={false} />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}
