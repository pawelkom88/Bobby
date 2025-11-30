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

  // Check for query parameters
  const canceled = searchParams.get('canceled') === 'true';
  const needsCredits = searchParams.get('needsCredits') === 'true';
  const fromSuccess = searchParams.get('fromSuccess') === 'true';

  // Clear session data before starting conversation
  useEffect(() => {
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

  // Clean up needsCredits param if user actually has credits
  useEffect(() => {
    if (needsCredits && hasCredits && !creditsLoading) {
      const url = new URL(window.location.href);
      url.searchParams.delete('needsCredits');
      window.history.replaceState({}, '', url.toString());
    }
  }, [needsCredits, hasCredits, creditsLoading]);

  const handleCorrectNumber = async () => {
    // Don't proceed if still loading/refreshing credits
    if (creditsLoading || isRefreshingFromPayment) {
      console.log('Credits still loading, waiting...');
      return;
    }

    // Force a fresh check of credits before proceeding
    if (fromSuccess) {
      console.log('Post-payment: forcing fresh credit check');
      await forceRefreshCredits();
    }

    // If user has credits, navigate to conversation
    if (hasCredits) {
      console.log('User has credits, navigating to conversation');
      window.location.href = ROUTES.CONVERSATION;
      return;
    }

    // Double-check: fetch credits directly to avoid stale state
    console.log('hasCredits is false, verifying with direct fetch...');

    // No credits - redirect to Stripe checkout
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
                onCorrectNumber={handleCorrectNumber}
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
