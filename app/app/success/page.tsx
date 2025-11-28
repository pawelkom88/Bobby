import { redirect } from 'next/navigation';
import Link from 'next/link';
import { stripe } from '@/lib/stripe';
import { ROUTES } from '@/lib/routes';

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { session_id: sessionIdParam } = await searchParams;

  // Ensure session_id is a string
  const sessionId = Array.isArray(sessionIdParam)
    ? sessionIdParam[0]
    : sessionIdParam;

  // Handle missing session_id gracefully
  if (!sessionId) {
    return (
      <div className="success-page">
        <div className="success-container">
          <h1>Session Not Found</h1>
          <p>We couldn&apos;t find your payment session.</p>
          <Link href={ROUTES.DIAL} className="success-cta-button">
            Go to Practice
          </Link>
        </div>
      </div>
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    });

    const { status, customer_details, metadata } = session;

    // Session is still open (payment not complete)
    if (status === 'open') {
      return redirect(ROUTES.DIAL);
    }

    // Session expired
    if (status === 'expired') {
      return (
        <div className="success-page">
          <div className="success-container">
            <h1>Session Expired</h1>
            <p>This payment session has expired.</p>
            <Link href={ROUTES.DIAL} className="success-cta-button">
              Try Again
            </Link>
          </div>
        </div>
      );
    }

    // Payment complete
    if (status === 'complete') {
      const customerEmail = customer_details?.email || 'you';
      const credits = metadata?.credits || '0';
      const packType = metadata?.packType || 'credits';

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
              A confirmation email will be sent to <strong>{customerEmail}</strong>.
            </p>
            <div className="success-details">
              <p>Pack: {packType.charAt(0).toUpperCase() + packType.slice(1)}</p>
              <p>Credits Added: {credits}</p>
            </div>
            <Link href={ROUTES.DIAL} className="success-cta-button">
              Start Practicing! 📞
            </Link>
          </div>
        </div>
      );
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
    console.error('Error retrieving session:', error);
    return (
      <div className="success-page">
        <div className="success-container">
          <h1>Something Went Wrong</h1>
          <p>We couldn&apos;t verify your payment. Please contact support if you were charged.</p>
          <Link href={ROUTES.DIAL} className="success-cta-button">
            Go to Practice
          </Link>
        </div>
      </div>
    );
  }
}
