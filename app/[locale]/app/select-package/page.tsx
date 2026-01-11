'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import CartoonButton from '@/components/CartoonButton';
import { useAuth } from '@/context/AuthContext';
import { useCredits } from '@/context/CreditsContext';
import { ROUTES } from '@/lib/routes';
import {
  DISPLAY_PACKAGES,
  DisplayPackage,
  type PackType,
} from '@/config/packages';
import { SpeculationRules } from '@/components/SpeculationRules';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { useUserData } from '@/context/UserDataContext';
import {
  getDialStoryContext,
  clearDialStoryContext,
} from '@/lib/dialStoryContext';
import {
  getStorySummaryFromJourney,
  hasStorySelection,
} from '@/utils/select-package';

function SelectPackagePageContent() {
  const t = useTranslations('selectPackage');
  const tCommon = useTranslations('common');
  const tAge = useTranslations('yourAge');
  const tEmergency = useTranslations('chooseEmergency');
  const locale = useLocale();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const {
    hasCredits,
    loading: creditsLoading,
    isServerConfirmed,
  } = useCredits();
  const searchParams = useSearchParams();

  const canceled = searchParams.get('canceled') === 'true';
  const needsCredits = searchParams.get('needsCredits') === 'true';
  const { getJourneyState } = useUserData();
  const journeyState = getJourneyState();
  const router = useRouter();

  const storedStoryContext = needsCredits ? getDialStoryContext() : null;

  useEffect(() => {
    if (isServerConfirmed && hasCredits) {
      window.location.href = ROUTES.DIAL;
    }
  }, [isServerConfirmed, hasCredits]);

  useEffect(() => {
    if (!canceled) return;

    const timeout = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('canceled');
      window.history.replaceState({}, '', url.toString());
    }, 3000);

    return () => clearTimeout(timeout);
  }, [canceled]);

  useEffect(() => {
    if (!needsCredits) {
      clearDialStoryContext();
    }
  }, [needsCredits]);

  const journeyStoryContext = getStorySummaryFromJourney(journeyState);
  const storySummary = storedStoryContext ?? journeyStoryContext;
  const shouldShowStorySummary =
    needsCredits && hasStorySelection(storySummary);

  const ageLabel = storySummary?.ageTier
    ? tAge(`ages.tier${storySummary.ageTier}`)
    : null;

  const scenarioLabel = storySummary?.service
    ? tEmergency(`services.${storySummary.service}`)
    : null;

  const handleChangeStory = () => {
    router.push(ROUTES.YOUR_AGE);
  };

  const handleSelectPackage = async (packType: PackType) => {
    if (!user) {
      setCheckoutError(t('errors.loginRequired'));
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const idToken = await user.getIdToken(true);

      const response = await fetch(
        `/api/checkout_sessions?locale=${locale}&packType=${packType}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

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
      setCheckoutError(t('errors.checkoutFailed'));
      setCheckoutLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = ROUTES.CHOOSE_EMERGENCY;
  };

  if (authLoading || creditsLoading || !isServerConfirmed) {
    return <LoadingSpinner />;
  }

  // If user has credits, show loading while redirect happens
  if (hasCredits) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageWrapper>
        <ErrorBoundary>
          <main className="app-page" role="main">
            {/* Header */}
            <div className="select-package-header">
              <h1 className="select-package-title">{t('title')}</h1>
              <p className="select-package-subtitle">{t('subtitle')}</p>
            </div>

            {shouldShowStorySummary && (
              <section
                className="select-package-story-summary"
                aria-live="polite"
              >
                <p className="select-package-story-title">
                  {t('storySummary.title')}
                </p>
                <div className="select-package-story-pills">
                  {ageLabel && (
                    <span className="select-package-story-pill">
                      {t('storySummary.ageLabel')}: {ageLabel}
                    </span>
                  )}
                  {scenarioLabel && (
                    <span className="select-package-story-pill">
                      {t('storySummary.scenarioLabel')}: {scenarioLabel}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="select-package-story-link"
                  onClick={handleChangeStory}
                >
                  {t('storySummary.changeSelection')}
                </button>
              </section>
            )}

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
  const isRookie = pkg.id === 'rookie';

  return (
    <>
      <div className={`pricing-card ${isRookie ? 'card-yellow' : 'card-blue'}`}>
        <Image
          width={150}
          height={150}
          src={`${isRookie ? '/bobby-rookie-pack.png' : '/bobby-hero-pack.png'}`}
          alt={pkg.name}
        />
        <div className="card-content">
          <h2 className="card-title">{t(`packs.${pkg.id}`)}</h2>
          <p className="card-subtitle">{t(`packs.${pkg.id}Subtitle`)}</p>
          <p className="card-ideal-for">{t(`${pkg.id}.idealFor`)}</p>

          <div className="card-price">
            <span className="price-amount">{t(`${pkg.id}.price`)}</span>
            <div className="price-microcopy">
              {t('microcopy.oneTimePurchase')}
            </div>
          </div>

          <div className="card-features">
            <p className="features-title">{t(`${pkg.id}.includes`)}</p>
            <ul className="features-list">
              {(t.raw(`${pkg.id}.features`) as string[]).map(
                (feature, index) => (
                  <li key={index} className="feature-item">
                    {feature}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="card-description">
            <p className="desc-title">
              {t(`${pkg.id}.${isRookie ? 'bestFor' : 'whyChoose'}`)}
            </p>
            <p className="desc-text">
              {t(`${pkg.id}.${isRookie ? 'bestForDesc' : 'whyChooseDesc'}`)}
            </p>
          </div>
        </div>

        <button
          className={`select-button ${isRookie ? 'button-blue' : 'button-yellow'}`}
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
                  <span className="price">{t(`${pkg.id}.cta`)}</span>
                )}
              </div>
            </div>
          </div>
        </button>

        <div className="card-microcopy-bottom">
          {t('microcopy.callsNeverExpire')}
        </div>
      </div>
    </>
  );
}
