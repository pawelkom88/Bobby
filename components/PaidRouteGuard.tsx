'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCredits } from '@/context/CreditsContext';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import LoadingSpinner from './LoadingSpinner';

interface PaidRouteGuardProps {
  children: ReactNode;
}

/**
 * PaidRouteGuard - Client-side route protection requiring credits
 *
 * Wraps protected pages that require credits to access.
 * - Shows loading spinner while checking credits
 * - Redirects to /app/dial?needsCredits=true if user has no credits
 * - Renders children if user has credits
 *
 * Note: This is client-side protection. Server-side validation
 * should also be implemented for sensitive operations.
 */
export default function PaidRouteGuard({ children }: PaidRouteGuardProps) {
  const {
    hasCredits,
    loading: creditsLoading,
    isInitialized,
  } = useCredits();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isLoading = authLoading || creditsLoading;

  useEffect(() => {
    // Wait for loading to complete AND for credits to be initialized
    // isInitialized ensures we've set up the real-time listener and aren't just
    // looking at the initial fetch result
    if (isLoading || !isInitialized) return;

    // If not authenticated, redirect to login
    if (!user) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    // If we have credits, allow access
    if (hasCredits) {
      console.log('PaidRouteGuard: Access granted (credits available)');
      return;
    }

    // If no credits after initial load, user genuinely has no credits
    console.log('PaidRouteGuard: No credits available, redirecting to dial');
    router.replace(`${ROUTES.DIAL}?needsCredits=true`);

  }, [isLoading, isInitialized, user, hasCredits, router]);

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="paid-route-guard-loading">
        <LoadingSpinner />
        <p>Checking access...</p>
      </div>
    );
  }

  // If not authenticated or no credits, show nothing (redirect will happen)
  if (!user || !hasCredits) {
    return (
      <div className="paid-route-guard-loading">
        <LoadingSpinner text="Redirecting..." />
      </div>
    );
  }

  // User has credits, render children
  return <>{children}</>;
}
