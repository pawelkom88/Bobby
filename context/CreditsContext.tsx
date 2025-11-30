'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { doc, onSnapshot, getDoc, getDocFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { logger } from '@/lib/logger';

interface CreditsContextType {
  credits: number;
  hasCredits: boolean;
  loading: boolean;
  error: string | null;
  forceRefreshCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

interface CreditsProviderProps {
  children: ReactNode;
}

/**
 * CreditsProvider - Provides real-time credits state across the app
 * 
 * Listens to the user's Firestore document for credits changes.
 * Credits are only modified server-side (via Stripe webhook), so this
 * provides a read-only view of the user's credit balance.
 */
export function CreditsProvider({ children }: CreditsProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) {
      console.log('CreditsContext: Auth still loading, waiting...');
      return;
    }

    // If no user, reset state
    if (!user) {
      console.log('CreditsContext: No user, resetting credits to 0');
      setCredits(0);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('CreditsContext: Setting up credits for user:', user.uid);
    setLoading(true);

    const setupCredits = async () => {
      try {
        // First, do an immediate fetch to get current credits from server
        console.log('CreditsContext: Doing initial fetch for current credits...');
        const userDocRef = doc(db, 'users', user.uid);
        const initialDoc = await getDocFromServer(userDocRef);

        if (initialDoc.exists()) {
          const data = initialDoc.data();
          const userCredits = typeof data.credits === 'number' ? data.credits : 0;
          console.log('CreditsContext: Initial fetch - credits:', userCredits);
          setCredits(userCredits);
        } else {
          console.log('CreditsContext: Initial fetch - user document not found');
          setCredits(0);
        }

        // Now set up real-time listener for future updates
        console.log('CreditsContext: Setting up real-time listener...');
        const unsubscribe = onSnapshot(
          userDocRef,
          (docSnapshot) => {
            console.log('CreditsContext: onSnapshot triggered for user:', user.uid);
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              const userCredits = typeof data.credits === 'number' ? data.credits : 0;
              console.log('CreditsContext: User document exists, credits:', userCredits);
              setCredits(userCredits);
              console.log('CreditsContext: Credits updated to:', userCredits);
            } else {
              console.log('CreditsContext: User document not found, setting credits to 0');
              setCredits(0);
              console.log('CreditsContext: User document not found, credits set to 0');
            }
            console.log('CreditsContext: Setting loading to false');
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.error('CreditsContext: Error listening to credits:', err.message);
            console.error('CreditsContext: Full error:', err);
            setError('Failed to load credits');
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('CreditsContext: Error during initial fetch:', error);
        setCredits(0);
        setLoading(false);
        setError('Failed to load credits');
        return () => {}; // Return empty cleanup function
      }
    };

    const cleanupPromise = setupCredits();

    // Cleanup function
    return () => {
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, [user, authLoading]);

  /**
   * Force refresh credits by manually fetching from Firestore
   * Useful when real-time listener might be delayed (e.g., after payment)
   */
  const forceRefreshCredits = async (): Promise<void> => {
    if (!user) {
      console.log('CreditsContext: Cannot refresh credits: no authenticated user');
      return;
    }

    console.log('CreditsContext: Starting force refresh for user:', user.uid);

    try {
      setLoading(true);
      setError(null);

      console.log('CreditsContext: Fetching user document from Firestore (server)...');
      const userDocRef = doc(db, 'users', user.uid);
      const docSnapshot = await getDocFromServer(userDocRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const userCredits = typeof data.credits === 'number' ? data.credits : 0;
        console.log('CreditsContext: Force refresh - document exists, credits:', userCredits);
        setCredits(userCredits);
        console.log('CreditsContext: Credits force refreshed to:', userCredits);
      } else {
        console.log('CreditsContext: Force refresh - user document not found, setting credits to 0');
        setCredits(0);
        console.log('CreditsContext: Credits set to 0 during force refresh');
      }
    } catch (error) {
      console.error('CreditsContext: Error force refreshing credits');
      setError('Failed to refresh credits');
    } finally {
      console.log('CreditsContext: Force refresh completed, setting loading to false');
      setLoading(false);
    }
  };

  const value: CreditsContextType = {
    credits,
    hasCredits: credits > 0,
    loading: authLoading || loading,
    error,
    forceRefreshCredits,
  };

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}

/**
 * Hook to access credits state
 * @returns CreditsContextType with credits, hasCredits, loading, and error
 * @throws Error if used outside of CreditsProvider
 */
export function useCredits(): CreditsContextType {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}

