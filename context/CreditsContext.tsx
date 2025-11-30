'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import { doc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface CreditsContextType {
  credits: number;
  hasCredits: boolean;
  loading: boolean;
  error: string | null;
  forceRefreshCredits: () => Promise<void>;
  isInitialized: boolean;
  isServerConfirmed: boolean; // NEW: Explicitly track server confirmation
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

interface CreditsProviderProps {
  children: ReactNode;
}

export function CreditsProvider({ children }: CreditsProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isServerConfirmed, setIsServerConfirmed] = useState<boolean>(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const serverConfirmedRef = useRef<boolean>(false);

  useEffect(() => {
    // Cleanup previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Reset state
    serverConfirmedRef.current = false;
    setIsServerConfirmed(false);

    if (authLoading) {
      console.log('CreditsContext: Auth still loading, waiting...');
      return;
    }

    if (!user) {
      console.log('CreditsContext: No user, resetting credits to 0');
      setCredits(0);
      setLoading(false);
      setError(null);
      setIsInitialized(true);
      setIsServerConfirmed(true);
      return;
    }

    console.log('CreditsContext: Setting up credits for user:', user.uid);
    setLoading(true);
    setIsInitialized(false);
    setIsServerConfirmed(false);

    const userDocRef = doc(db, 'users', user.uid);

    // KEY FIX: Use includeMetadataChanges to detect cache vs server
    const unsubscribe = onSnapshot(
      userDocRef,
      { includeMetadataChanges: true },
      docSnapshot => {
        const metadata = docSnapshot.metadata;
        const fromCache = metadata.fromCache;
        const hasPendingWrites = metadata.hasPendingWrites;

        console.log('CreditsContext: onSnapshot triggered', {
          userId: user.uid,
          fromCache,
          hasPendingWrites,
          exists: docSnapshot.exists(),
          source: fromCache ? 'CACHE' : 'SERVER',
        });

        let userCredits = 0;
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          userCredits = typeof data.credits === 'number' ? data.credits : 0;
        }

        console.log(
          `CreditsContext: Credits = ${userCredits} (from ${fromCache ? 'CACHE' : 'SERVER'})`
        );

        // Always update credits with latest value
        setCredits(userCredits);
        setError(null);

        // KEY LOGIC: Only finalize loading state when we have SERVER data
        if (!fromCache && !hasPendingWrites) {
          console.log('CreditsContext: ✓ SERVER data confirmed');
          serverConfirmedRef.current = true;
          setIsServerConfirmed(true);
          setLoading(false);
          setIsInitialized(true);
        } else if (fromCache && !serverConfirmedRef.current) {
          console.log(
            'CreditsContext: ⏳ Cache data received, waiting for server confirmation...'
          );
          // Keep loading = true, don't mark as initialized yet
          // But we can show the cached value as a preview
        }
      },
      err => {
        console.error('CreditsContext: Error listening to credits:', err);
        setError('Failed to load credits');
        setLoading(false);
        setIsInitialized(true);
        setIsServerConfirmed(true); // Treat error as "confirmed" to unblock UI
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Safety timeout: If server doesn't respond within 15s, use cached data
    const timeoutId = setTimeout(() => {
      if (!serverConfirmedRef.current) {
        console.warn(
          'CreditsContext: ⚠️ Server timeout (15s), using available data'
        );
        setLoading(false);
        setIsInitialized(true);
        setIsServerConfirmed(true);
      }
    }, 15000);

    return () => {
      console.log('CreditsContext: Cleaning up listener');
      clearTimeout(timeoutId);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, authLoading]);

  const forceRefreshCredits = useCallback(async (): Promise<void> => {
    if (!user) {
      console.log(
        'CreditsContext: Cannot refresh credits: no authenticated user'
      );
      return;
    }

    console.log('CreditsContext: Starting force refresh for user:', user.uid);

    try {
      const userDocRef = doc(db, 'users', user.uid);

      // Retry logic for webhook timing issues
      const maxAttempts = 5;
      const delayMs = 1000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(
          `CreditsContext: Force refresh attempt ${attempt}/${maxAttempts}`
        );

        const docSnapshot = await getDocFromServer(userDocRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const userCredits =
            typeof data.credits === 'number' ? data.credits : 0;
          console.log(
            `CreditsContext: Server returned credits: ${userCredits}`
          );
          setCredits(userCredits);

          if (userCredits > 0) {
            console.log(
              'CreditsContext: ✓ Credits found, force refresh complete'
            );
            return;
          }
        }

        if (attempt < maxAttempts) {
          console.log(
            `CreditsContext: No credits yet, waiting ${delayMs}ms before retry...`
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      console.log(
        'CreditsContext: Force refresh complete (no credits after retries)'
      );
    } catch (error) {
      console.error('CreditsContext: Error force refreshing credits:', error);
      setError('Failed to refresh credits');
    }
  }, [user]);

  const value: CreditsContextType = {
    credits,
    hasCredits: credits > 0,
    loading: authLoading || loading,
    error,
    forceRefreshCredits,
    isInitialized,
    isServerConfirmed,
  };

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}

export function useCredits(): CreditsContextType {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}
