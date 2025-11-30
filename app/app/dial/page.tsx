'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { ViewTransition } from 'react';
import { Activity } from 'react';
import { useSearchParams } from 'next/navigation';
import DialPad from '@/components/DialPad';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSecureSession } from '@/hooks/useSecureSession';
import { ROUTES } from '@/lib/routes';
import { useCredits } from '@/context/CreditsContext';
import { useAuth } from '@/context/AuthContext';
import { SpeculationRules } from '@/components/SpeculationRules';
import LoadingSpinner from '@/components/LoadingSpinner';

function DialPageContent() {
  const { credits, hasCredits, loading: creditsLoading, forceRefreshCredits } = useCredits();
  const { user } = useAuth();
  const { clearSession } = useSecureSession();
  const searchParams = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isRefreshingFromPayment, setIsRefreshingFromPayment] = useState(false);
  const hasRefreshedRef = useRef(false);
  const [hasVerifiedCredits, setHasVerifiedCredits] = useState(false);

  console.log('DialPageContent: Component rendered/updated', {
    credits,
    hasCredits,
    creditsLoading,
    isRefreshingFromPayment,
    hasVerifiedCredits,
    user: !!user
  });

  // Check for query parameters
  const canceled = searchParams.get('canceled') === 'true';
  const needsCredits = searchParams.get('needsCredits') === 'true';
  const fromSuccess = searchParams.get('fromSuccess') === 'true';

  console.log('DialPageContent: URL params -', {
    canceled,
    needsCredits,
    fromSuccess
  });

  // Clear session data before starting conversation
  useEffect(() => {
    console.log('DialPageContent: useEffect - clearSession');
    clearSession();
  }, [clearSession]);

  // Force refresh credits when returning from successful payment
  useEffect(() => {
    const refreshCreditsAfterPayment = async () => {
      if (fromSuccess && user && !hasRefreshedRef.current) {
        hasRefreshedRef.current = true;
        setIsRefreshingFromPayment(true);
        console.log('Returning from successful payment, forcing credits refresh');

        try {
          await forceRefreshCredits();

          // Clean up URL params after successful refresh
          const url = new URL(window.location.href);
          url.searchParams.delete('fromSuccess');
          url.searchParams.delete('needsCredits');
          window.history.replaceState({}, '', url.toString());
        } catch (error) {
          console.error('Failed to refresh credits after payment');
        } finally {
          setIsRefreshingFromPayment(false);
        }
      }
    };

    refreshCreditsAfterPayment();
  }, [fromSuccess, user, forceRefreshCredits]);

  // Reset verification state when credits change
  useEffect(() => {
    console.log('DialPageContent: useEffect - credits changed, resetting hasVerifiedCredits');
    setHasVerifiedCredits(false);
  }, [credits]);

  // Clean up needsCredits param if user actually has credits
  useEffect(() => {
    console.log('DialPageContent: useEffect - checking if needsCredits param should be cleaned up', {
      needsCredits,
      hasCredits,
      creditsLoading
    });
    if (needsCredits && hasCredits && !creditsLoading) {
      console.log('DialPageContent: Cleaning up needsCredits param from URL');
      const url = new URL(window.location.href);
      url.searchParams.delete('needsCredits');
      window.history.replaceState({}, '', url.toString());
    }
  }, [needsCredits, hasCredits, creditsLoading]);

  const handleCorrectNumber = async () => {
    console.log('handleCorrectNumber called - user should have credits');

    // If we've already verified credits, proceed directly
    if (hasVerifiedCredits && hasCredits) {
      console.log('Credits already verified, navigating to conversation');
      window.location.href = ROUTES.CONVERSATION;
      return;
    }

    console.log('Starting credit verification process...');

    // Force a fresh check of credits before proceeding
    if (fromSuccess) {
      console.log('Post-payment: forcing fresh credit check');
      await forceRefreshCredits();
    }

    // Double-check: fetch credits directly to avoid stale state
    console.log('Final verification: hasCredits =', hasCredits, 'credits =', credits);

    // Extra verification: wait for real-time listener to update
    if (fromSuccess) {
      console.log('Post-payment: waiting 2 seconds for real-time updates...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check credits again after the delay
      console.log('Post-delay verification: hasCredits =', hasCredits, 'credits =', credits);
      if (!hasCredits) {
        console.log('Still no credits after delay, staying on dial page');
        return;
      }
    }

    // Final verification - force refresh one more time if needed
    if (!hasCredits) {
      console.log('Final check: forcing one more refresh before navigation');
      await forceRefreshCredits();

      if (!hasCredits) {
        console.log('Still no credits after final refresh, staying on dial page');
        return;
      }
    }

    // If user has credits, navigate to conversation and mark as verified
    console.log('User has credits, navigating to conversation');
    setHasVerifiedCredits(true);
    window.location.href = ROUTES.CONVERSATION;
  };

  const handleCheckoutNeeded = async () => {
    console.log('No credits available, starting checkout process');

    if (!user) {
      console.error('No user found when trying to checkout');
      setCheckoutError('Please log in to continue');
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
      console.log('Redirecting to Stripe checkout:', url);
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error occurred');
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

  // Show loading state while refreshing from payment
  const isLoading = creditsLoading || isRefreshingFromPayment;

  return (
    <>
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main">
              {/* Status messages - only show needsCredits if actually no credits */}
              {canceled && (
                <div className="dial-message dial-message-warning" role="alert">
                  Payment was canceled. You can try again when you&apos;re ready!
                </div>
              )}
              {needsCredits && !hasCredits && !isLoading && (
                <div className="dial-message dial-message-info" role="alert">
                  You need credits to start a practice call.
                </div>
              )}
              {isRefreshingFromPayment && (
                <div className="dial-message dial-message-success" role="status">
                  Loading your credits...
                </div>
              )}

              {/* Credits display */}
              <Activity mode={isProcessingCheckout ? "hidden" : "visible"}>
                {!isLoading && (
                  <div className="dial-credits-display">
                    <span className="dial-credits-label">Credits:</span>
                    <span className="dial-credits-value">{credits}</span>
                  </div>
                )}
              </Activity>

              <DialPad
                onCorrectNumber={hasCredits ? handleCorrectNumber : handleCheckoutNeeded}
                onBack={handleBack}
                isLoading={checkoutLoading || isLoading}
                buttonLabel={hasCredits ? 'CALL' : isLoading ? 'LOADING...' : 'BUY & CALL'}
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
