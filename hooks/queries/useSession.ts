'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchSession } from '@/lib/api/session';
import { createQueryKeyFactory } from '@/lib/queryClient';

/**
 * Query key factory for session-related queries
 */
export const sessionKeys = createQueryKeyFactory('session');

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
    queryFn: () => fetchSession(getAuthToken),
    enabled: options?.enabled ?? !!user,
    staleTime: 1000 * 60, // 1 minute
  });
}
