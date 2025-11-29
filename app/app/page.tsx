'use client';

import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CartoonButton from '@/components/CartoonButton';
import { ViewTransition } from 'react';
import AnimatedImageWrapper from '@/components/AnimatedImageWrapper';
import { ROUTES } from '@/lib/routes';
import { SpeculationRules } from '@/components/SpeculationRules';

export default function AppPage() {
  return (
    <>
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main">
              <div className="welcome-container">
                <div className="welcome-card">
                  <div>
                    <h1 className="welcome-title">Hello, Hero!</h1>
                    <p className="welcome-subtitle">
                      I'm Bobby. Let's learn to save the day!
                    </p>
                  </div>

                  <AnimatedImageWrapper
                    src="/bobby-hero.png"
                    alt="Bobby"
                    width={275}
                    height={275}
                    className="welcome-image"
                  />

                  <CartoonButton
                    containerClassName="welcome-button"
                    asLink
                    href={ROUTES.YOUR_AGE}
                  >
                    📞 CALL BOBBY
                  </CartoonButton>
                </div>
              </div>
            </main>
          </ErrorBoundary>
        </PageWrapper>
      </ViewTransition>
      <SpeculationRules prerenderPaths={[ROUTES.YOUR_AGE]} />
    </>
  );
}
