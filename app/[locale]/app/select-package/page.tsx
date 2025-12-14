'use client';

import { useEffect, useState, Suspense } from 'react';
import { ViewTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
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
import { logger } from '@/lib/logger';

function SelectPackagePageContent() {
  const t = useTranslations('selectPackage');
  const tCommon = useTranslations('common');
  const locale = useLocale();
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
      setCheckoutError(t('errors.loginRequired'));
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const idToken = await user.getIdToken(true);

      const response = await fetch(`/api/checkout_sessions?locale=${locale}`, {
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
      logger.error('Checkout error:', error);
      setCheckoutError(
        error instanceof Error ? error.message : t('errors.checkoutFailed')
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
                <h1 className="select-package-title">{t('title')}</h1>
                <p className="select-package-subtitle">
                  {t('subtitle')}
                </p>
              </div>
              <br />

              {/* Canceled message */}
              {canceled && (
                <div
                  className="select-package-message select-package-message-warning"
                  role="alert"
                >
                  {t('messages.canceled')}
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
                  {tCommon('back')}
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
  const t = useTranslations('selectPackage');
  const isHero = pkg.id === 'hero';

  return (
    <>
      <div className={`pricing-card ${isHero ? 'card-blue' : 'card-yellow'}`}>
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
                  t('loading')
                ) : (
                  <>
                    <span className="currency">{t('buyPrefix')}</span>
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
