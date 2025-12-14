'use client';

import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/fetcher';
import { 
  SessionDataSchema, 
  SessionGetResponseSchema,
  type SessionData 
} from '@/schemas/session.schema';
import { createQueryKeyFactory } from '@/lib/queryClient';

/**
 * Query key factory for session-related queries
 */
export const sessionKeys = createQueryKeyFactory('session');

/**
 * Fetcher function for session data
 */
async function fetchSessionData(getAuthToken: () => Promise<string | null>): Promise<SessionData> {
  const response = await authenticatedFetch(
    '/api/session/get',
    SessionGetResponseSchema,
    getAuthToken
  );
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch session data');
  }
  
  return response.data;
}

/**
 * Suspense query for session data (preferred)
 * 
 * Usage:
 * <QueryBoundary>
 *   <ComponentUsingSession />
 * </QueryBoundary>
 * 
 * function ComponentUsingSession() {
 *   const session = useSessionSuspense();
 *   return <div>{session.completionId}</div>;
 * }
 */
export function useSessionSuspense() {
  const { user } = useAuth();
  
  const getAuthToken = async () => {
    if (!user) return null;
    return `Bearer ${await user.getIdToken()}`;
  };
  
  return useSuspenseQuery({
    queryKey: sessionKeys.data(),
    queryFn: () => fetchSessionData(getAuthToken),
    // Session data is critical for app functionality
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

/**
 * Standard query for session data (when suspense not possible)
 * 
 * Usage:
 * function Component() {
 *   const { data: session, isLoading, error } = useSession({ 
 *     enabled: user !== null 
 *   });
 *   
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error />;
 *   return <div>{session?.completionId}</div>;
 * }
 */
export function useSession(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  
  const getAuthToken = async () => {
    if (!user) return null;
    return `Bearer ${await user.getIdToken()}`;
  };
  
  return useQuery({
    queryKey: sessionKeys.data(),
    queryFn: () => fetchSessionData(getAuthToken),
    enabled: options?.enabled ?? !!user,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

/**
 * Hook to check if session exists
 * Returns a boolean without suspending
 */
export function useHasSession() {
  const { data: session, isLoading } = useSession();
  
  return {
    hasSession: !!session && !isLoading,
    isLoading,
  };
}
