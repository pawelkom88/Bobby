import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { ROUTES } from '@/lib/routes';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import Image from 'next/image';
import SuccessPageLayout, {
  SuccessContent,
} from '@/components/SuccessPageLayout';

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

  const sessionId = Array.isArray(sessionIdParam)
    ? sessionIdParam[0]
    : sessionIdParam;

  logger.log('SuccessPage: Processing sessionId:', sessionId);

  if (!sessionId) {
    logger.log(
      'SuccessPage: No sessionId provided - payment incomplete or invalid'
    );
    return (
      <SuccessPageLayout>
        <Image
          src="/bobby-payment-failed.png"
          alt="Success"
          width={250}
          height={200}
        />
        <SuccessContent
          title="Payment Incomplete"
          message="We couldn't verify your payment status. Please check your email or try again."
          email="If you completed a payment, your credits will be added automatically."
          ctaText="Try Again"
          ctaHref={ROUTES.SELECT_PACKAGE}
        />
      </SuccessPageLayout>
    );
  }

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

    if (status === 'open') {
      logger.log('SuccessPage: Session still open, redirecting to dial');
      return redirect(ROUTES.DIAL);
    }

    if (status === 'expired') {
      logger.log('SuccessPage: Session expired');
      return (
        <SuccessPageLayout>
          <Image
            src="/bobby-payment-failed.png"
            alt="Success"
            width={250}
            height={200}
          />
          <SuccessContent
            title="Session Expired"
            message="This payment session has expired."
            ctaText="Try Again"
          />
        </SuccessPageLayout>
      );
    }

    if (status !== 'complete') {
      logger.log('SuccessPage: Payment failed or cancelled', { status });
      return (
        <SuccessPageLayout>
          <Image
            src="/bobby-payment-failed.png"
            alt="Success"
            width={250}
            height={200}
          />
          <SuccessContent
            title="Payment Failed"
            message="Your payment could not be processed. Please try again or contact your bank."
            email="You were not charged. Please try a different payment method if the issue persists."
            ctaText="Try Again"
            ctaHref={ROUTES.SELECT_PACKAGE}
          />
        </SuccessPageLayout>
      );
    }

    if (status === 'complete') {
      const sessionEmail = customer_details?.email;
      const credits = metadata?.credits || '0';
      const packType = metadata?.packType || 'credits';
      logger.log('SuccessPage: Payment complete, credits:', credits);

      return (
        <SuccessPageLayout>
          <Image
            src="/bobby-payment-successful.png"
            alt="Success"
            width={250}
            height={200}
          />
          <SuccessContent
            title="Payment Successful!"
            message={`Thank you for your purchase! You've received ${credits} credits.`}
            email={`A confirmation email will be sent to ${sessionEmail || 'you'}.`}
            ctaText="Start Practicing!"
          />
        </SuccessPageLayout>
      );
    }

    logger.log('SuccessPage: Unhandled session status', { status });
    return (
      <SuccessPageLayout>
        <Image
          src="/bobby-payment-failed.png"
          alt="Success"
          width={250}
          height={200}
        />
        <SuccessContent
          title="Payment Status Unclear"
          message="We couldn't determine your payment status. Please check your email for confirmation."
          email="If you were charged, your credits will be added automatically. Otherwise, please try again."
          ctaText="Check Payment Status"
          ctaHref={ROUTES.SELECT_PACKAGE}
        />
      </SuccessPageLayout>
    );
  } catch (error) {
    logger.error('Success page - Error retrieving session:', {
      sessionId,
      error: error instanceof Error ? error.message : error,
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return (
      <SuccessPageLayout>
        <Image
          src="/bobby-payment-failed.png"
          alt="Success"
          width={250}
          height={200}
        />
        <SuccessContent
          title="Something Went Wrong"
          message="We couldn't verify your payment. Please contact support if you were charged."
          ctaText="Go to Practice"
        />
      </SuccessPageLayout>
    );
  }
}
