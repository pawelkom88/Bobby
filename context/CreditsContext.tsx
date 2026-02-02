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
import { logger } from '@/lib/logger';

interface CreditsContextType {
  credits: number;
  hasCredits: boolean;
  loading: boolean;
  error: string | null;
  forceRefreshCredits: () => Promise<void>;
  isInitialized: boolean;
  isServerConfirmed: boolean; // NEW: Explicitly track server confirmation
  conversationActive: boolean; // NEW: Track if user is in active conversation
  setConversationActive: (active: boolean) => void; // NEW: Allow setting conversation state
  isBetaUser: boolean; // NEW: Track if user is in beta mode
  betaCredits: number; // NEW: Beta credit count
  effectiveCredits: number; // NEW: Credits based on current mode (beta or paid)
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
  const [conversationActive, setConversationActive] = useState<boolean>(false);
  const [betaCredits, setBetaCredits] = useState<number>(0);
  const [isBetaUser, setIsBetaUser] = useState<boolean>(false);
  const [effectiveCredits, setEffectiveCredits] = useState<number>(0);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const serverConfirmedRef = useRef<boolean>(false);
  const debugEnabledRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search;
    const debugParam = search.includes('debugCredits=1');
    const debugStorage = window.localStorage?.getItem('debugCredits') === '1';
    debugEnabledRef.current = debugParam || debugStorage;
    if (debugEnabledRef.current) {
      console.log('[CreditsDebug] enabled', {
        debugParam,
        debugStorage,
        href: window.location.href,
      });
    }
  }, []);

  const debugLog = (...args: any[]) => {
    if (!debugEnabledRef.current) return;
    console.warn('[CreditsDebug]', ...args);
  };

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
      debugLog('Auth still loading, waiting...');
      return;
    }

    if (!user) {
      debugLog('No user, resetting credits to 0');
      setCredits(0);
      setLoading(false);
      setError(null);
      setIsInitialized(true);
      setIsServerConfirmed(true);
      return;
    }

    debugLog('Setting up credits for user:', user.uid);
    setLoading(true);
    setIsInitialized(false);
    setIsServerConfirmed(false);

    const userDocRef = doc(db, 'users', user.uid);

    // KEY FIX: Use includeMetadataChanges to detect cache vs server
    unsubscribeRef.current = onSnapshot(
      userDocRef,
      { includeMetadataChanges: true },
      docSnapshot => {
        const metadata = docSnapshot.metadata;
        const fromCache = metadata.fromCache;
        const hasPendingWrites = metadata.hasPendingWrites;

        debugLog('onSnapshot triggered', {
          userId: user.uid,
          fromCache,
          hasPendingWrites,
          exists: docSnapshot.exists(),
          source: fromCache ? 'CACHE' : 'SERVER',
        });

        let userCredits = 0;
        let userBetaCredits = 0;
        let effectiveCredits = 0;
        let isBetaMode = false;

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          debugLog('User data:', data);
          userCredits = typeof data.credits === 'number' ? data.credits : 0;
          userBetaCredits =
            typeof data.betaCredits === 'number' ? data.betaCredits : 0;
          
          // Check if user is a beta user (user-level flag, not global env)
          isBetaMode = data.betaUser === true && userBetaCredits > 0;

          // Determine effective credits based on user's beta status
          effectiveCredits = isBetaMode ? userBetaCredits : userCredits;
        }

        debugLog('Computed credits', {
          userCredits,
          userBetaCredits,
          isBetaMode,
          effectiveCredits,
          source: fromCache ? 'CACHE' : 'SERVER',
        });

        // Always update all credit values
        setCredits(userCredits);
        setBetaCredits(userBetaCredits);
        setIsBetaUser(isBetaMode); // Reuse this state to indicate beta mode is active
        setEffectiveCredits(effectiveCredits);
        setError(null);

        // KEY LOGIC: Only finalize loading state when we have SERVER data
        if (!fromCache && !hasPendingWrites) {
          debugLog('SERVER data confirmed');
          serverConfirmedRef.current = true;
          setIsServerConfirmed(true);
          setLoading(false);
          setIsInitialized(true);
        } else if (fromCache && !serverConfirmedRef.current) {
          debugLog('Cache data received, waiting for server confirmation...');
          // Keep loading = true, don't mark as initialized yet
          // But we can show the cached value as a preview
        }
      },
      err => {
        debugLog('Error listening to credits:', err);
        setError('Failed to load credits');
        setLoading(false);
        setIsInitialized(true);
        setIsServerConfirmed(true); // Treat error as "confirmed" to unblock UI
      }
    );

    // Safety timeout: If server doesn't respond within 15s, use cached data
    const timeoutId = setTimeout(() => {
      if (!serverConfirmedRef.current) {
        debugLog('Server timeout (15s), using available data');
        setLoading(false);
        setIsInitialized(true);
        setIsServerConfirmed(true);
      }
    }, 15000);

    return () => {
      debugLog('Cleaning up listener');
      clearTimeout(timeoutId);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, authLoading]);

  const forceRefreshCredits = useCallback(async (): Promise<void> => {
    if (!user) {
      debugLog('Cannot refresh credits: no authenticated user');
      return;
    }

    debugLog('Starting force refresh for user:', user.uid);

    try {
      const userDocRef = doc(db, 'users', user.uid);

      // Retry logic for webhook timing issues
      const maxAttempts = 5;
      const delayMs = 1000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        debugLog(`Force refresh attempt ${attempt}/${maxAttempts}`);

        const docSnapshot = await getDocFromServer(userDocRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const userCredits =
            typeof data.credits === 'number' ? data.credits : 0;
          const userBetaCredits =
            typeof data.betaCredits === 'number' ? data.betaCredits : 0;
          const isBetaMode = data.betaUser === true && userBetaCredits > 0;
          const effective = isBetaMode ? userBetaCredits : userCredits;
          
          debugLog('Server returned credits', {
            userCredits,
            userBetaCredits,
            isBetaMode,
            effective,
          });
          
          setCredits(userCredits);
          setBetaCredits(userBetaCredits);
          setIsBetaUser(isBetaMode);
          setEffectiveCredits(effective);
          setError(null);

          if (effective > 0) {
            debugLog('Credits found, force refresh complete');
            return;
          }
        }

        if (attempt < maxAttempts) {
          debugLog(`No credits yet, waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      debugLog('Force refresh complete (no credits after retries)');
    } catch (error) {
      debugLog('Error force refreshing credits:', error);
      setError('Failed to refresh credits');
    }
  }, [user]);

  const value: CreditsContextType = {
    credits,
    hasCredits: effectiveCredits > 0 || conversationActive,
    loading: authLoading || loading,
    error,
    forceRefreshCredits,
    isInitialized,
    isServerConfirmed,
    conversationActive,
    setConversationActive,
    isBetaUser,
    betaCredits,
    effectiveCredits,
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
