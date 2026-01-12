import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { ROUTES } from '@/lib/routes';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import SuccessPageLayout, {
  SuccessContent,
} from '@/components/SuccessPageLayout';

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations('success');
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
          title={t('incomplete.title')}
          message={t('incomplete.message')}
          email={t('incomplete.email')}
          ctaText={t('incomplete.cta')}
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
            title={t('expired.title')}
            message={t('expired.message')}
            ctaText={t('expired.cta')}
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
            title={t('failed.title')}
            message={t('failed.message')}
            email={t('failed.email')}
            ctaText={t('failed.cta')}
            ctaHref={ROUTES.SELECT_PACKAGE}
          />
        </SuccessPageLayout>
      );
    }

    if (status === 'complete') {
      const sessionEmail = customer_details?.email;
      const credits = parseInt(metadata?.credits || '0', 10);
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
            title={t('complete.title')}
            message={t('complete.message', { credits })}
            email={t('complete.email', { email: sessionEmail || t('complete.emailFallback') })}
            ctaText={t('complete.cta')}
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
          title={t('unclear.title')}
          message={t('unclear.message')}
          email={t('unclear.email')}
          ctaText={t('unclear.cta')}
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
          title={t('error.title')}
          message={t('error.message')}
          ctaText={t('error.cta')}
        />
      </SuccessPageLayout>
    );
  }
}
