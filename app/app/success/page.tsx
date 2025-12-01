import { redirect } from 'next/navigation';
import Link from 'next/link';
import { stripe } from '@/lib/stripe';
import { ROUTES } from '@/lib/routes';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import Image from 'next/image';
import CartoonButton from '@/components/CartoonButton';

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const { session_id: sessionIdParam, test } = params;

  logger.log('SuccessPage: Component loaded with params:', {
    sessionIdParam,
    test,
  });

  // Ensure session_id is a string
  const sessionId = Array.isArray(sessionIdParam)
    ? sessionIdParam[0]
    : sessionIdParam;

  logger.log('SuccessPage: Processing sessionId:', sessionId);

  // Handle missing session_id gracefully
  if (!sessionId) {
    logger.log('SuccessPage: No sessionId provided, showing generic success');
    return (
      <div className="success-page">
        <div className="success-container">
          <h1>Payment Successful!</h1>
          <Image
            src="/bobby-payment-successful.png"
            alt="Success"
            width={250}
            height={200}
          />
          <p className="success-message">
            Thank you for your purchase! Your credits have been added to your
            account.
          </p>
          <p className="success-email">
            You should receive a confirmation email from Stripe shortly.
          </p>
          <CartoonButton asLink href={`${ROUTES.DIAL}?fromSuccess=true`}>
            Let's go !
          </CartoonButton>
        </div>
      </div>
    );
  }

  // Check if user is authenticated (has bobby_auth cookie)
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has('bobby_auth');
  logger.log('SuccessPage: User authenticated:', isAuthenticated);

  try {
    logger.log('SuccessPage: Retrieving session from Stripe...');
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    });

    const { status, customer_details, metadata } = session;
    logger.log('SuccessPage: Session status:', status);

    // Session is still open (payment not complete)
    if (status === 'open') {
      logger.log('SuccessPage: Session still open, redirecting to dial');
      return redirect(ROUTES.DIAL);
    }

    // Session expired
    if (status === 'expired') {
      logger.log('SuccessPage: Session expired');
      return (
        <div className="success-page">
          <div className="success-container">
            <h1>Session Expired</h1>
            <p>This payment session has expired.</p>
            <Link
              href={`${ROUTES.DIAL}?fromSuccess=true`}
              className="success-cta-button"
            >
              Try Again
            </Link>
          </div>
        </div>
      );
    }

    // Payment complete
    if (status === 'complete') {
      const sessionEmail = customer_details?.email;
      const credits = metadata?.credits || '0';
      const packType = metadata?.packType || 'credits';
      logger.log('SuccessPage: Payment complete, credits:', credits);

      // If user is authenticated, show full details
      // Otherwise, show generic success message to prevent information disclosure
      if (isAuthenticated) {
        return (
          <div className="success-page">
            <div className="success-container">
              <div className="success-icon">🎉</div>
              <h1>Payment Successful!</h1>
              <p className="success-message">
                Thank you for your purchase! You&apos;ve received{' '}
                <strong>{credits} credits</strong>.
              </p>
              <p className="success-email">
                A confirmation email will be sent to{' '}
                <strong>{sessionEmail || 'you'}</strong>.
              </p>
              <div className="success-details">
                <p>
                  Pack: {packType.charAt(0).toUpperCase() + packType.slice(1)}
                </p>
                <p>Credits Added: {credits}</p>
              </div>
              <Link
                href={`${ROUTES.DIAL}?fromSuccess=true`}
                className="success-cta-button"
              >
                Start Practicing! 📞
              </Link>
            </div>
          </div>
        );
      } else {
        // Not authenticated - show generic message to prevent information disclosure
        return (
          <div className="success-page">
            <div className="success-container">
              <div className="success-icon">🎉</div>
              <h1>Payment Successful!</h1>
              <p className="success-message">
                Thank you for your purchase! Your credits have been added to
                your account.
              </p>
              <p className="success-email">
                You should receive a confirmation email from Stripe shortly.
              </p>
              <div className="success-note">
                <p>
                  <em>Please log in to view your purchase details.</em>
                </p>
              </div>
              <Link
                href={`${ROUTES.DIAL}?fromSuccess=true`}
                className="success-cta-button"
              >
                Start Practicing! 📞
              </Link>
            </div>
          </div>
        );
      }
    }

    // Unknown status
    return (
      <div className="success-page">
        <div className="success-container">
          <h1>Payment Status Unknown</h1>
          <p>Please check your email for confirmation.</p>
          <Link href={ROUTES.DIAL} className="success-cta-button">
            Go to Practice
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    logger.error('Success page - Error retrieving session:', {
      sessionId,
      error: error instanceof Error ? error.message : error,
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return (
      <div className="success-page">
        <div className="success-container">
          <h1>Something Went Wrong</h1>
          <p>
            We couldn&apos;t verify your payment. Please contact support if you
            were charged.
          </p>
          <Link
            href={`${ROUTES.DIAL}?fromSuccess=true`}
            className="success-cta-button"
          >
            Go to Practice
          </Link>
        </div>
      </div>
    );
  }
}
