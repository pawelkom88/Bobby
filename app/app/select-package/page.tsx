'use client';

import { useEffect, useState, Suspense } from 'react';
import { ViewTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import CartoonButton from '@/components/CartoonButton';
import { useAuth } from '@/context/AuthContext';
import { useCredits } from '@/context/CreditsContext';
import { useUserData } from '@/context/UserDataContext';
import { ROUTES } from '@/lib/routes';
import {
  DISPLAY_PACKAGES,
  DisplayPackage,
  type PackType,
} from '@/config/packages';
import { SpeculationRules } from '@/components/SpeculationRules';
import Image from 'next/image';

function SelectPackagePageContent() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const {
    hasCredits,
    loading: creditsLoading,
    isServerConfirmed,
  } = useCredits();
  const { getJourneyState } = useUserData();
  const searchParams = useSearchParams();

  const canceled = searchParams.get('canceled') === 'true';

  // Redirect when credits are CONFIRMED from server and user has credits
  useEffect(() => {
    if (isServerConfirmed && hasCredits) {
      window.location.href = ROUTES.DIAL;
    }
  }, [isServerConfirmed, hasCredits]);

  // Route guard: verify user has completed previous steps
  useEffect(() => {
    const journeyState = getJourneyState();
    if (!journeyState?.selectedAgeTier) {
      window.location.href = ROUTES.YOUR_AGE;
      return;
    }
    if (!journeyState?.selectedService) {
      window.location.href = ROUTES.CHOOSE_EMERGENCY;
      return;
    }
  }, [getJourneyState]);

  // Clean up canceled parameter after 3 seconds
  useEffect(() => {
    if (!canceled) return;

    const timeout = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('canceled');
      window.history.replaceState({}, '', url.toString());
    }, 3000);

    return () => clearTimeout(timeout);
  }, [canceled]);

  const handleSelectPackage = async (packType: PackType) => {
    if (!user) {
      setCheckoutError('Please log in to continue');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const idToken = await user.getIdToken(true);

      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ packType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('Failed to get checkout URL');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(
        error instanceof Error ? error.message : 'Failed to start checkout'
      );
      setCheckoutLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = ROUTES.CHOOSE_EMERGENCY;
  };

  // KEY FIX: Don't render UI until we have SERVER-CONFIRMED credits state
  // This prevents the flash of package selection UI
  if (authLoading || creditsLoading || !isServerConfirmed) {
    return <LoadingSpinner />;
  }

  // If user has credits, show loading while redirect happens
  if (hasCredits) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main">
              {/* Header */}
              <div className="select-package-header">
                <h1 className="select-package-title">Choose Your Pack</h1>
                <p className="select-package-subtitle">
                  Each credit = 1 practice call
                </p>
              </div>
              <br />

              {/* Canceled message */}
              {canceled && (
                <div
                  className="select-package-message select-package-message-warning"
                  role="alert"
                >
                  Checkout was canceled. Select a pack to try again.
                </div>
              )}

              {/* Error message */}
              {checkoutError && (
                <div
                  className="select-package-message select-package-message-error"
                  role="alert"
                >
                  {checkoutError}
                </div>
              )}

              {/* Package cards */}
              <div className="select-package-cards-container">
                {Object.values(DISPLAY_PACKAGES).map(pkg => (
                  <PackCard
                    key={pkg.id}
                    pkg={pkg}
                    handleSelectPackage={handleSelectPackage}
                    checkoutLoading={checkoutLoading}
                  />
                ))}
              </div>

              <div className="select-package-back-button">
                <CartoonButton
                  containerClassName="select-package-back-button-container"
                  onClick={handleBack}
                  disabled={checkoutLoading}
                >
                  ← BACK
                </CartoonButton>
              </div>
              <br />
            </main>
          </ErrorBoundary>
        </PageWrapper>
      </ViewTransition>
      <SpeculationRules prerenderPaths={[ROUTES.DIAL]} />
    </>
  );
}

export default function SelectPackagePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SelectPackagePageContent />
    </Suspense>
  );
}

interface PackCardProps {
  pkg: DisplayPackage;
  handleSelectPackage: (packType: PackType) => void;
  checkoutLoading: boolean;
}

function PackCard({
  pkg,
  handleSelectPackage,
  checkoutLoading,
}: PackCardProps) {
  const isHero = pkg.id === 'hero';

  return (
    <>
      <div className={`pricing-card ${isHero ? 'card-yellow' : 'card-blue'}`}>
        <Image
          width={150}
          height={150}
          src={`${isHero ? '/bobby-hero-pack.png' : '/bobby-rookie-pack.png'}`}
          alt={pkg.name}
        />
        <div className="card-content">
          <h2 className="card-title">{pkg.name}</h2>
        </div>

        <button
          className={`select-button ${isHero ? 'button-yellow' : 'button-blue'}`}
          onClick={() => handleSelectPackage(pkg.id)}
          disabled={checkoutLoading}
        >
          <div className="price-tag-container">
            <div className="price-tag">
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="sparkle"></div>
              <div className="price-text">
                {checkoutLoading ? (
                  'Loading...'
                ) : (
                  <>
                    <span className="currency">Buy £</span>
                    {pkg.displayPrice.replace('£', '')}
                  </>
                )}
              </div>
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
