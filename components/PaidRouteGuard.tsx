'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCredits } from '@/context/CreditsContext';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import LoadingSpinner from './LoadingSpinner';

interface PaidRouteGuardProps {
  children: ReactNode;
}

export default function PaidRouteGuard({ children }: PaidRouteGuardProps) {
  const {
    credits,
    hasCredits,
    loading: creditsLoading,
    isInitialized,
    isServerConfirmed,
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
      console.log('PaidRouteGuard: Waiting for server-confirmed data...', {
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
      console.log('PaidRouteGuard: No user, redirecting to login');
      setAccessDecision('denied');
      router.replace(ROUTES.LOGIN);
      return;
    }

    // Now we have SERVER-confirmed credit data
    if (hasCredits) {
      console.log(
        'PaidRouteGuard: ✓ Access granted (server-confirmed credits:',
        credits,
        ')'
      );
      setAccessDecision('granted');
    } else {
      console.log(
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
  ]);

  // Show loading while waiting for SERVER confirmation
  if (!isFullyLoaded || accessDecision === 'pending') {
    return (
      <div className="paid-route-guard-loading">
        <LoadingSpinner />
        <p>Verifying access...</p>
      </div>
    );
  }

  // If denied, show redirecting state
  if (accessDecision === 'denied') {
    return (
      <div className="paid-route-guard-loading">
        <LoadingSpinner text="Redirecting..." />
      </div>
    );
  }

  // Access granted - render children
  return <>{children}</>;
}
