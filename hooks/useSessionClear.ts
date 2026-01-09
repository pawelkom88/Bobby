import { useEffect, useRef } from 'react';
import { useClearSession } from '@/hooks/mutations/useSessionMutations';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to clear session data once per user when starting a new conversation flow.
 * This extracts the common pattern from dial, your-age, and choose-emergency pages.
 *
 * The hook uses a ref to track which user's session has been cleared,
 * preventing multiple clear operations on re-renders or state changes.
 */
export function useSessionClear() {
  const clearSession = useClearSession();
  const { user, loading } = useAuth();
  const hasClearedSessionForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (clearSession.isPending || clearSession.isSuccess) return;

    const userId = user.uid;
    if (hasClearedSessionForUserRef.current === userId) return;

    hasClearedSessionForUserRef.current = userId;
    clearSession.mutate();
  }, [clearSession, user, loading]);

  return clearSession;
}
