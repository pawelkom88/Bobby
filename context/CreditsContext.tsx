'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { logger } from '@/lib/logger';

interface CreditsContextType {
  credits: number;
  hasCredits: boolean;
  loading: boolean;
  error: string | null;
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
      return;
    }

    // If no user, reset state
    if (!user) {
      setCredits(0);
      setLoading(false);
      setError(null);
      return;
    }

    // Set up real-time listener for user's credits
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          // Credits field may not exist for new users, default to 0
          const userCredits = typeof data.credits === 'number' ? data.credits : 0;
          setCredits(userCredits);
          logger.info('Credits updated:', userCredits);
        } else {
          // User document doesn't exist yet
          setCredits(0);
          logger.info('User document not found, credits set to 0');
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        logger.error('Error listening to credits:', err);
        setError('Failed to load credits');
        setLoading(false);
      }
    );

    // Cleanup listener on unmount or user change
    return () => {
      unsubscribe();
    };
  }, [user, authLoading]);

  const value: CreditsContextType = {
    credits,
    hasCredits: credits > 0,
    loading: authLoading || loading,
    error,
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

