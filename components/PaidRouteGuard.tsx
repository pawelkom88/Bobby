'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCredits } from '@/context/CreditsContext';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import LoadingSpinner from './LoadingSpinner';
import { logger } from '@/lib/logger';

interface PaidRouteGuardProps {
  children: ReactNode;
}

export default function PaidRouteGuard({ children }: PaidRouteGuardProps) {
  const t = useTranslations('paidRouteGuard');
  const {
    credits,
    hasCredits,
    loading: creditsLoading,
    isInitialized,
    isServerConfirmed,
    conversationActive,
  } = useCredits();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Track if we've made a decision to prevent flicker
  const [accessDecision, setAccessDecision] = useState<
    'pending' | 'granted' | 'denied'
  >('pending');

  const isFullyLoaded =
    !authLoading && !creditsLoading && isInitialized && isServerConfirmed;

  useEffect(() => {
    // Don't make any decisions until we have SERVER-confirmed data
    if (!isFullyLoaded) {
      logger.log('PaidRouteGuard: Waiting for server-confirmed data...', {
        authLoading,
        creditsLoading,
        isInitialized,
        isServerConfirmed,
        credits,
      });
      return;
    }

    // If not authenticated, redirect to login
    if (!user) {
      logger.log('PaidRouteGuard: No user, redirecting to login');
      setAccessDecision('denied');
      router.replace(ROUTES.LOGIN);
      return;
    }

    // Now we have SERVER-confirmed credit data
    // CRITICAL: If conversation is active, allow access even with 0 credits
    // This prevents redirect during the completion flow
    if (hasCredits || conversationActive) {
      logger.log(
        'PaidRouteGuard: ✓ Access granted (server-confirmed credits:',
        conversationActive
      );
      setAccessDecision('granted');
    } else {
      logger.log(
        'PaidRouteGuard: ✗ No credits (server-confirmed), redirecting to dial'
      );
      setAccessDecision('denied');
      router.replace(`${ROUTES.DIAL}?needsCredits=true`);
    }
  }, [
    isFullyLoaded,
    user,
    hasCredits,
    credits,
    router,
    authLoading,
    creditsLoading,
    isInitialized,
    isServerConfirmed,
    conversationActive,
  ]);

  // Show loading while waiting for SERVER confirmation
  if (!isFullyLoaded || accessDecision === 'pending') {
    return (
      <div className="paid-route-guard-loading">
        <LoadingSpinner text={t('verifyingAccess')} />
      </div>
    );
  }

  // If denied, show redirecting state
  if (accessDecision === 'denied') {
    return (
      <div className="paid-route-guard-loading">
        <LoadingSpinner text={t('redirecting')} />
      </div>
    );
  }

  // Access granted - render children
  return <>{children}</>;
}
