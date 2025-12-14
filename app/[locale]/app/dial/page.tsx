'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { ViewTransition } from 'react';
import { Activity } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import DialPad from '@/components/DialPad';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSession } from '@/hooks/queries/useSession';
import { useClearSession } from '@/hooks/mutations/useSessionMutations';
import { ROUTES } from '@/lib/routes';
import { useCredits } from '@/context/CreditsContext';
import { useAuth } from '@/context/AuthContext';
import { SpeculationRules } from '@/components/SpeculationRules';
import LoadingSpinner from '@/components/LoadingSpinner';
import { logger } from '@/lib/logger';

function DialPageContent() {
  const t = useTranslations('dial');
  const tAuth = useTranslations('auth.errors');
  const {
    credits,
    hasCredits,
    loading: creditsLoading,
    forceRefreshCredits,
  } = useCredits();
  const { user, loading: authLoading } = useAuth();
  const clearSession = useClearSession();
  const searchParams = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isRefreshingFromPayment, setIsRefreshingFromPayment] = useState(false);
  const hasRefreshedRef = useRef(false);
  const hasClearedSessionForUserRef = useRef<string | null>(null);
  const [hasVerifiedCredits, setHasVerifiedCredits] = useState(false);

  logger.log('DialPageContent: Component rendered/updated', {
    credits,
    hasCredits,
    creditsLoading,
    isRefreshingFromPayment,
    hasVerifiedCredits,
    user: !!user,
  });

  // Check for query parameters
  const canceled = searchParams.get('canceled') === 'true';
  const needsCredits = searchParams.get('needsCredits') === 'true';
  const fromSuccess = searchParams.get('fromSuccess') === 'true';

  logger.log('DialPageContent: URL params -', {
    canceled,
    needsCredits,
    fromSuccess,
  });

  // Clear session data before starting conversation
  useEffect(() => {
    logger.log('DialPageContent: useEffect - clearSession');
    if (authLoading || !user) return;
    if (clearSession.isPending || clearSession.isSuccess) return;

    const userId = user.uid;
    if (hasClearedSessionForUserRef.current === userId) return;

    hasClearedSessionForUserRef.current = userId;
    clearSession.mutate();
  }, [authLoading, clearSession, user]);

  // Force refresh credits when returning from successful payment
  useEffect(() => {
    const refreshCreditsAfterPayment = async () => {
      if (fromSuccess && user && !hasRefreshedRef.current) {
        hasRefreshedRef.current = true;
        setIsRefreshingFromPayment(true);
        logger.log(
          'Returning from successful payment, forcing credits refresh'
        );

        try {
          await forceRefreshCredits();

          // Clean up URL params after successful refresh
          const url = new URL(window.location.href);
          url.searchParams.delete('fromSuccess');
          url.searchParams.delete('needsCredits');
          window.history.replaceState({}, '', url.toString());
        } catch (error) {
          logger.error('Failed to refresh credits after payment');
        } finally {
          setIsRefreshingFromPayment(false);
        }
      }
    };

    refreshCreditsAfterPayment();
  }, [fromSuccess, user, forceRefreshCredits]);

  // Reset verification state when credits change
  useEffect(() => {
    logger.log(
      'DialPageContent: useEffect - credits changed, resetting hasVerifiedCredits'
    );
    setHasVerifiedCredits(false);
  }, [credits]);

  // Clean up needsCredits param if user actually has credits
  useEffect(() => {
    logger.log(
      'DialPageContent: useEffect - checking if needsCredits param should be cleaned up',
      {
        needsCredits,
        hasCredits,
        creditsLoading,
      }
    );
    if (needsCredits && hasCredits && !creditsLoading) {
      logger.log('DialPageContent: Cleaning up needsCredits param from URL');
      const url = new URL(window.location.href);
      url.searchParams.delete('needsCredits');
      window.history.replaceState({}, '', url.toString());
    }
  }, [needsCredits, hasCredits, creditsLoading]);

  const handleCorrectNumber = async () => {
    logger.log('handleCorrectNumber called - user should have credits');

    // If we've already verified credits, proceed directly
    if (hasVerifiedCredits && hasCredits) {
      logger.log('Credits already verified, navigating to conversation');
      window.location.href = ROUTES.CONVERSATION;
      return;
    }

    logger.log('Starting credit verification process...');

    // Force a fresh check of credits before proceeding
    if (fromSuccess) {
      logger.log('Post-payment: forcing fresh credit check');
      await forceRefreshCredits();
    }

    // Double-check: fetch credits directly to avoid stale state
    logger.log('Final verification: hasCredits =', hasCredits);

    // CRITICAL: If we don't have credits, don't navigate
    if (!hasCredits) {
      logger.log(
        'No credits available after verification, staying on dial page'
      );
      return;
    }

    // If user has credits, navigate to conversation and mark as verified
    logger.log('User has credits, navigating to conversation');
    setHasVerifiedCredits(true);
    window.location.href = ROUTES.CONVERSATION;
  };

  const handleCheckoutNeeded = async () => {
    logger.log('No credits available, starting checkout process');

    if (!user) {
      logger.error('No user found when trying to checkout');
      setCheckoutError(tAuth('pleaseLogin'));
      return;
    }

    setCheckoutLoading(true);
    setIsProcessingCheckout(true);
    setCheckoutError(null);

    try {
      const idToken = await user.getIdToken(true);

      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ packType: 'responder' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      logger.log('Redirecting to Stripe checkout:', url);
      window.location.href = url;
    } catch (error) {
      logger.error('Checkout error occurred');
      setCheckoutError(
        error instanceof Error ? error.message : 'Failed to start checkout'
      );
      setCheckoutLoading(false);
      setIsProcessingCheckout(false);
    }
  };

  const handleBack = () => {
    window.location.href = ROUTES.CHOOSE_EMERGENCY;
  };

  const isLoading = creditsLoading || isRefreshingFromPayment;

  return (
    <>
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main">
              {canceled && (
                <div className="dial-message dial-message-warning" role="alert">
                  {t('messages.canceled')}
                </div>
              )}
              {needsCredits && !hasCredits && !isLoading && (
                <div className="dial-message dial-message-info" role="alert">
                  {t('messages.needsCredits')}
                </div>
              )}
              {isRefreshingFromPayment && (
                <div
                  className="dial-message dial-message-success"
                  role="status"
                >
                  {t('messages.loadingCredits')}
                </div>
              )}
              {checkoutError && (
                <div className="dial-message dial-message-warning" role="alert">
                  {checkoutError}
                </div>
              )}

              <Activity mode={isProcessingCheckout ? 'hidden' : 'visible'}>
                {isLoading ? (
                  <div className="skeleton">
                    <div className="shimmer" />
                  </div>
                ) : (
                  <div className="dial-credits-display">
                    <span className="dial-credits-label">{t('creditsLabel')}</span>
                    <span className="dial-credits-value">{credits}</span>
                  </div>
                )}
              </Activity>

              <DialPad
                onCorrectNumber={
                  hasCredits ? handleCorrectNumber : handleCheckoutNeeded
                }
                onBack={handleBack}
                isLoading={checkoutLoading || isLoading}
                buttonLabel={
                  hasCredits ? t('buttons.call') : isLoading ? t('buttons.loading') : t('buttons.buyAndCall')
                }
              />
            </main>
          </ErrorBoundary>
        </PageWrapper>
      </ViewTransition>
      <SpeculationRules prerenderPaths={[ROUTES.CONVERSATION]} />
    </>
  );
}

export default function DialPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DialPageContent />
    </Suspense>
  );
}
