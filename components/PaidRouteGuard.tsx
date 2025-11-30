'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCredits } from '@/context/CreditsContext';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import LoadingSpinner from './LoadingSpinner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const [isVerifyingCredits, setIsVerifyingCredits] = useState(false);

  const isLoading = authLoading || creditsLoading || isVerifyingCredits;

  useEffect(() => {
    const checkCreditsDirectly = async () => {
      // Wait for loading to complete
      if (isLoading) {
        console.log('PaidRouteGuard: Still loading, waiting...', {
          authLoading,
          creditsLoading,
          isLoading
        });
        return;
      }

      console.log('PaidRouteGuard: Checking access - user:', !!user, 'hasCredits:', hasCredits, 'creditsLoading:', creditsLoading, 'authLoading:', authLoading);

      // If not authenticated, redirect to login
      if (!user) {
        console.log('PaidRouteGuard: No user, redirecting to login');
        router.replace(ROUTES.LOGIN);
        return;
      }

      // If hasCredits is already true, grant access immediately
      if (hasCredits) {
        console.log('PaidRouteGuard: Access granted (credits already available)');
        return;
      }

      // If no credits in context, fetch directly from database
      console.log('PaidRouteGuard: No credits in context, fetching directly from Firestore...');
      setIsVerifyingCredits(true);

      try {
        console.log('PaidRouteGuard: Querying Firestore for user credits...');
        const userDocRef = doc(db, 'users', user.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const userCredits = typeof data.credits === 'number' ? data.credits : 0;
          console.log('PaidRouteGuard: Direct Firestore query - credits:', userCredits);

          if (userCredits > 0) {
            console.log('PaidRouteGuard: Credits found in database, granting access');
            // Credits exist, allow access (context will update via real-time listener)
          } else {
            console.log('PaidRouteGuard: No credits found in database, redirecting');
            router.replace(`${ROUTES.DIAL}?needsCredits=true`);
          }
        } else {
          console.log('PaidRouteGuard: User document not found, assuming no credits');
          router.replace(`${ROUTES.DIAL}?needsCredits=true`);
        }
      } catch (error) {
        console.error('PaidRouteGuard: Error fetching credits from Firestore:', error);
        router.replace(`${ROUTES.DIAL}?needsCredits=true`);
      } finally {
        setIsVerifyingCredits(false);
      }
    };

    checkCreditsDirectly();
  }, [isLoading, user, hasCredits, router]);

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="paid-route-guard-loading">
        <LoadingSpinner />
        <p>{isVerifyingCredits ? 'Verifying credits...' : 'Checking access...'}</p>
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
