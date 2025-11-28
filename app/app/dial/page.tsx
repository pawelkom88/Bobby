'use client';

import { useEffect, useState, Suspense } from 'react';
import { ViewTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import DialPad from '@/components/DialPad';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ROUTES } from '@/lib/routes';
import { useCredits } from '@/context/CreditsContext';
import { useAuth } from '@/context/AuthContext';
import { logger } from '@/lib/logger';

function DialPageContent() {
  const { credits, hasCredits, loading: creditsLoading } = useCredits();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Check for query parameters
  const canceled = searchParams.get('canceled') === 'true';
  const needsCredits = searchParams.get('needsCredits') === 'true';

  // Clear session data before starting conversation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('conversationComplete');
      sessionStorage.removeItem('lastAssessment');
      sessionStorage.removeItem('completionId');
      sessionStorage.removeItem('processedCompletionId');
    }
  }, []);

  const handleCorrectNumber = async () => {
    // If user has credits, navigate to conversation
    if (hasCredits) {
      window.location.href = ROUTES.CONVERSATION;
      return;
    }

    // No credits - redirect to Stripe checkout
    if (!user) {
      logger.error('No user found when trying to checkout');
      setCheckoutError('Please log in to continue');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      // Get fresh Firebase ID token
      const idToken = await user.getIdToken();

      // Create checkout session
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ packType: 'responder' }), // Default to responder pack (2 calls)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      logger.error('Checkout error:', error);
      setCheckoutError(
        error instanceof Error ? error.message : 'Failed to start checkout'
      );
      setCheckoutLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to emergency selection
    window.location.href = ROUTES.CHOOSE_EMERGENCY;
  };

  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <main className="app-page" role="main">
            {/* Status messages */}
            {canceled && (
              <div className="dial-message dial-message-warning" role="alert">
                Payment was canceled. You can try again when you&apos;re ready!
              </div>
            )}
            {needsCredits && (
              <div className="dial-message dial-message-info" role="alert">
                You need credits to start a practice call.
              </div>
            )}
            {checkoutError && (
              <div className="dial-message dial-message-error" role="alert">
                {checkoutError}
              </div>
            )}

            {/* Credits display */}
            {!creditsLoading && (
              <div className="dial-credits-display">
                <span className="dial-credits-label">Credits:</span>
                <span className="dial-credits-value">{credits}</span>
              </div>
            )}

            <DialPad
              onCorrectNumber={handleCorrectNumber}
              onBack={handleBack}
              isLoading={checkoutLoading}
              buttonLabel={hasCredits ? 'CALL' : 'BUY & CALL'}
            />
          </main>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}

export default function DialPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DialPageContent />
    </Suspense>
  );
}
