'use client';

import { useEffect, useState, Suspense, useRef, startTransition } from 'react';
import { ViewTransition } from 'react';
import { Activity } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import DialPad from '@/components/DialPad';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ParentGateModal from '@/components/ParentGateModal';
import { useSessionClear } from '@/hooks/useSessionClear';
import { ROUTES } from '@/lib/routes';
import { useCredits } from '@/context/CreditsContext';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { persistDialStoryContext } from '@/lib/dialStoryContext';
import { SpeculationRules } from '@/components/SpeculationRules';
import LoadingSpinner from '@/components/LoadingSpinner';
import { logger } from '@/lib/logger';

const PARENT_GATE_SESSION_KEY = 'bobby_parent_gate_ack';

const getParentGateDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hasParentGateAcknowledgement = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.sessionStorage.getItem(PARENT_GATE_SESSION_KEY) ===
    getParentGateDateKey()
  );
};

const setParentGateAcknowledgement = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    PARENT_GATE_SESSION_KEY,
    getParentGateDateKey()
  );
};

function DialPageContent() {
  const router = useRouter();
  const t = useTranslations('dial');
  const tAuth = useTranslations('auth.errors');
  const {
    credits,
    betaCredits,
    isBetaUser,
    hasCredits,
    loading: creditsLoading,
    forceRefreshCredits,
  } = useCredits();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const { getJourneyState } = useUserData();
  const journeyState = getJourneyState();
  // todo Paw Paw: too much state / maybe use transition instead of checkout loading ? and boolean crap
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isRefreshingFromPayment, setIsRefreshingFromPayment] = useState(false);
  const hasRefreshedRef = useRef(false);
  const [hasVerifiedCredits, setHasVerifiedCredits] = useState(false);
  const [showParentGate, setShowParentGate] = useState(false);

  // Clear session data before starting conversation
  useSessionClear();

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

  // todo Paw: do we need that ? is it only initialisation ?
  useEffect(() => {
    logger.log(
      'DialPageContent: useEffect - credits changed, resetting hasVerifiedCredits'
    );
    // todo Paw: can we somehow derive this state ?
    setHasVerifiedCredits(false);
  }, [credits]);

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

    const startPractice = () => {
      if (hasParentGateAcknowledgement()) {
        startTransition(() => {
          router.push(ROUTES.CONVERSATION);
        });
      } else {
        setShowParentGate(true);
      }
    };

    // If we've already verified credits, proceed directly
    if (hasVerifiedCredits && hasCredits) {
      logger.log('Credits already verified, navigating to conversation');
      startPractice();
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

    // todo Paw: should this be first thing in this function ? early return
    if (!hasCredits) {
      logger.log(
        'No credits available after verification, staying on dial page'
      );
      return;
    }

    // If user has credits, navigate to conversation and mark as verified
    logger.log('User has credits, navigating to conversation');
    setHasVerifiedCredits(true);
    startPractice();
  };

  const handleCheckoutNeeded = () => {
    logger.log('No credits available, redirecting to package selection');

    if (!user) {
      logger.error('No user found when trying to checkout');
      setCheckoutError(tAuth('pleaseLogin'));
      return;
    }

    // todo Paw: 3 states ? maybe one with and object ?
    setCheckoutLoading(true);
    setIsProcessingCheckout(true);
    setCheckoutError(null);

    const storyContext = journeyState;
    if (storyContext?.selectedAgeTier || storyContext?.selectedService) {
      persistDialStoryContext({
        ageTier: storyContext.selectedAgeTier,
        service: storyContext.selectedService,
      });
    }

    window.location.href = `${ROUTES.SELECT_PACKAGE}?needsCredits=true`;
  };

  const handleBack = () => {
    startTransition(() => {
      router.push(ROUTES.CHOOSE_EMERGENCY);
    });
  };

  const handleParentGateConfirm = () => {
    setParentGateAcknowledgement();
    setShowParentGate(false);
    startTransition(() => {
      router.push(ROUTES.CONVERSATION);
    });
  };

  const handleParentGateCancel = () => {
    setShowParentGate(false);
  };

  const isLoading = creditsLoading || isRefreshingFromPayment;

  return (
    <>
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main" aria-hidden={showParentGate}>
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
                    <span className="dial-credits-label">
                      {isBetaUser ? t('betaCreditsLabel') : t('creditsLabel')}
                    </span>
                    <span className="dial-credits-value">
                      {isBetaUser ? betaCredits : credits}
                    </span>
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
                  // todo Paw: refactor to simpler code and extract to func and test
                  hasCredits
                    ? t('buttons.call')
                    : isLoading
                      ? t('buttons.loading')
                      : t('buttons.buyAndCall')
                }
              />
            </main>
            <ParentGateModal
              isOpen={showParentGate}
              onConfirm={handleParentGateConfirm}
              onCancel={handleParentGateCancel}
            />
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
