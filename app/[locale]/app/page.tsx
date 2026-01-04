'use client';

import { useTranslations } from 'next-intl';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CartoonButton from '@/components/CartoonButton';
import { ViewTransition } from 'react';
import AnimatedImageWrapper from '@/components/AnimatedImageWrapper';
import { ROUTES } from '@/lib/routes';
import { SpeculationRules } from '@/components/SpeculationRules';
import { useAuth } from '@/context/AuthContext';

// Function to extract and capitalize email name
function getGreetingName(email?: string | null): string {
  if (!email) return 'Hero';
  
  // Split at @ and take the first part
  const namePart = email.split('@')[0];
  
  // Capitalize first letter and keep the rest as is
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

export default function AppPage() {
  const t = useTranslations('app');
  const { user } = useAuth();
  const greetingName = getGreetingName(user?.email);
  
  return (
    <>
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main">
              <div className="welcome-container">
                <div className="welcome-card">
                  <div>
                    <h1 className="welcome-title">Hello, {greetingName}!</h1>
                    <p className="welcome-subtitle">{t('welcomeSubtitle')}</p>
                  </div>

                  <AnimatedImageWrapper
                    src="/bobby-hero.png"
                    alt={t('bobbyAlt')}
                    width={275}
                    height={275}
                    className="welcome-image"
                  />

                  <CartoonButton
                    containerClassName="welcome-button"
                    asLink
                    href={ROUTES.YOUR_AGE}
                  >
                    {t('callBobby')}
                  </CartoonButton>
                </div>
              </div>
            </main>
          </ErrorBoundary>
        </PageWrapper>
      </ViewTransition>
      <SpeculationRules prerenderPaths={[ROUTES.YOUR_AGE]} />
      <SpeculationRules prefetchPaths={[ROUTES.CHATS, ROUTES.ACHIEVEMENTS, ROUTES.SETTINGS]} eagerness="moderate" />
    </>
  );
}
