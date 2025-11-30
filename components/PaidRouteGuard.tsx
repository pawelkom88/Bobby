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
  const { hasCredits, loading: creditsLoading } = useCredits();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isLoading = authLoading || creditsLoading;

  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) {
      console.log('PaidRouteGuard: Still loading, waiting...');
      return;
    }

    console.log('PaidRouteGuard: Checking access - user:', !!user, 'hasCredits:', hasCredits);

    // If not authenticated, redirect to login
    if (!user) {
      console.log('PaidRouteGuard: No user, redirecting to login');
      router.replace(ROUTES.LOGIN);
      return;
    }

    // If no credits, redirect to dial page with needsCredits flag
    if (!hasCredits) {
      console.log('PaidRouteGuard: No credits, redirecting to dial with needsCredits');
      router.replace(`${ROUTES.DIAL}?needsCredits=true`);
      return;
    }

    console.log('PaidRouteGuard: Access granted');
  }, [isLoading, user, hasCredits, router]);

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
        <LoadingSpinner />
        <p>Redirecting...</p>
      </div>
    );
  }

  // User has credits, render children
  return <>{children}</>;
}
