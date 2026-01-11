'use client';

import {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Activity, ViewTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import DialPad from '@/components/DialPad';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageWrapper from '@/components/PageWrapper';
import ParentGateModal from '@/components/ParentGateModal';
import { SpeculationRules } from '@/components/SpeculationRules';
import { useAuth } from '@/context/AuthContext';
import { useCredits } from '@/context/CreditsContext';
import { useUserData } from '@/context/UserDataContext';
import { useSessionClear } from '@/hooks/useSessionClear';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';
import { persistDialStoryContext } from '@/lib/dialStoryContext';
import {
  hasParentGateAcknowledgement,
  setParentGateAcknowledgement,
} from '@/lib/parent-gate';
import { getDialButtonLabelKey, getStableUserId } from '@/utils/dial';

type UiState = {
  checkout: 'idle' | 'redirecting';
  refresh: 'idle' | 'refreshing';
  error: string | null;
  showParentGate: boolean;
};

function DialPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const { user } = useAuth();
  const { getJourneyState } = useUserData();

  useSessionClear();

  const [ui, setUi] = useState<UiState>({
    checkout: 'idle',
    refresh: 'idle',
    error: null,
    showParentGate: false,
  });

  // Keep latest hasCredits in a ref so async handlers can read the newest value
  const hasCreditsRef = useRef(hasCredits);
  useEffect(() => {
    hasCreditsRef.current = hasCredits;
  }, [hasCredits]);

  const userId = useMemo(() => getStableUserId(user), [user]);

  const canceled = searchParams.get('canceled') === 'true';
  const needsCredits = searchParams.get('needsCredits') === 'true';
  const fromSuccess = searchParams.get('fromSuccess') === 'true';

  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const handledFromSuccessRef = useRef(false);

  const replaceSearchParams = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const currentUrl = new URL(window.location.href);
      const nextUrl = new URL(window.location.href);

      mutate(nextUrl.searchParams);

      const current =
        currentUrl.pathname +
        (currentUrl.search ? currentUrl.search : '') +
        (currentUrl.hash ? currentUrl.hash : '');

      const next =
        nextUrl.pathname +
        (nextUrl.searchParams.toString()
          ? `?${nextUrl.searchParams.toString()}`
          : '') +
        (nextUrl.hash ? nextUrl.hash : '');

      // Avoid replace spam if nothing actually changes
      if (current === next) return;

      startTransition(() => {
        router.replace(next);
      });
    },
    [router]
  );

  const refreshCreditsOnce = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    setUi(prev => ({ ...prev, refresh: 'refreshing' }));

    refreshPromiseRef.current = (async () => {
      try {
        await forceRefreshCredits();
      } catch (e) {
        logger.error('Failed to refresh credits', e);
      } finally {
        setUi(prev => ({ ...prev, refresh: 'idle' }));
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [forceRefreshCredits]);

  useEffect(() => {
    if (!fromSuccess || !userId) return;

    if (handledFromSuccessRef.current) return;
    handledFromSuccessRef.current = true;

    logger.log('Returning from successful payment, forcing credits refresh');

    (async () => {
      await refreshCreditsOnce();

      replaceSearchParams(sp => {
        sp.delete('fromSuccess');
        sp.delete('needsCredits');
      });
    })();
  }, [fromSuccess, userId, refreshCreditsOnce, replaceSearchParams]);

  // Reset the "handled" flag when fromSuccess is no longer present
  useEffect(() => {
    if (!fromSuccess) handledFromSuccessRef.current = false;
  }, [fromSuccess]);

  useEffect(() => {
    if (!needsCredits) return;
    if (creditsLoading) return;
    if (!hasCredits) return;

    replaceSearchParams(sp => {
      sp.delete('needsCredits');
    });
  }, [needsCredits, creditsLoading, hasCredits, replaceSearchParams]);

  const startPractice = useCallback(() => {
    if (hasParentGateAcknowledgement()) {
      startTransition(() => {
        router.push(ROUTES.CONVERSATION);
      });
    } else {
      setUi(prev => ({ ...prev, showParentGate: true }));
    }
  }, [router]);

  const handleCorrectNumber = useCallback(async () => {
    logger.log('handleCorrectNumber called');

    // Fail fast
    if (!hasCreditsRef.current) {
      logger.log('No credits available; staying on dial page');
      return;
    }

    // Only force refresh when we have a concrete reason (post-payment redirect)
    if (fromSuccess) {
      logger.log('Post-payment: ensuring credits are fresh before continuing');
      await refreshCreditsOnce();
    }

    // Re-check using ref so we read the latest value after refresh completes
    if (!hasCreditsRef.current) {
      logger.log(
        'Credits still not available after refresh; staying on dial page'
      );
      return;
    }

    startPractice();
  }, [fromSuccess, refreshCreditsOnce, startPractice]);

  const handleCheckoutNeeded = useCallback(() => {
    logger.log('No credits available, redirecting to package selection');

    if (!userId) {
      logger.error('No user found when trying to checkout');
      setUi(prev => ({ ...prev, error: tAuth('pleaseLogin') }));
      return;
    }

    setUi(prev => ({ ...prev, checkout: 'redirecting', error: null }));

    // Only pull journey state at the moment we need it
    const journeyState = getJourneyState();
    if (journeyState?.selectedAgeTier || journeyState?.selectedService) {
      persistDialStoryContext({
        ageTier: journeyState.selectedAgeTier,
        service: journeyState.selectedService,
      });
    }

    // Prefer Next navigation so app state/searchParams are consistent
    startTransition(() => {
      router.push(`${ROUTES.SELECT_PACKAGE}?needsCredits=true`);
    });
  }, [getJourneyState, router, tAuth, userId]);

  const handleBack = useCallback(() => {
    startTransition(() => {
      router.push(ROUTES.CHOOSE_EMERGENCY);
    });
  }, [router]);

  const handleParentGateConfirm = useCallback(() => {
    setParentGateAcknowledgement();
    setUi(prev => ({ ...prev, showParentGate: false }));
    startTransition(() => {
      router.push(ROUTES.CONVERSATION);
    });
  }, [router]);

  const handleParentGateCancel = useCallback(() => {
    setUi(prev => ({ ...prev, showParentGate: false }));
  }, []);

  const isBusy =
    creditsLoading ||
    ui.refresh === 'refreshing' ||
    ui.checkout === 'redirecting';

  const buttonLabelKey = getDialButtonLabelKey({
    hasCredits,
    isBusy,
  });

  return (
    <>
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main
              className="app-page"
              role="main"
              aria-hidden={ui.showParentGate}
            >
              {canceled && (
                <div className="dial-message dial-message-warning" role="alert">
                  {t('messages.canceled')}
                </div>
              )}

              {needsCredits && !hasCredits && !isBusy && (
                <div className="dial-message dial-message-info" role="alert">
                  {t('messages.needsCredits')}
                </div>
              )}

              {ui.refresh === 'refreshing' && (
                <div
                  className="dial-message dial-message-success"
                  role="status"
                >
                  {t('messages.loadingCredits')}
                </div>
              )}

              {ui.error && (
                <div className="dial-message dial-message-warning" role="alert">
                  {ui.error}
                </div>
              )}

              <Activity
                mode={ui.checkout === 'redirecting' ? 'hidden' : 'visible'}
              >
                {isBusy ? (
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
                isLoading={isBusy}
                buttonLabel={t(buttonLabelKey)}
              />
            </main>

            <ParentGateModal
              isOpen={ui.showParentGate}
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
