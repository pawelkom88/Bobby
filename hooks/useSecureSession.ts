'use client';

import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';
import type { AssessmentData, SessionData } from '@/lib/session-storage';
import { logger } from '@/lib/logger';

/**
 * Hook for secure server-side session management
 *
 * Replaces client-side sessionStorage with encrypted server-side storage
 * All data is transmitted over HTTPS with Firebase authentication
 */
export function useSecureSession() {
  const { user, loading } = useAuth();

  const getAuthHeader = useCallback(async (): Promise<string | null> => {
    if (loading) {
      logger.warn('Auth still loading, cannot get token yet');
      return null;
    }

    if (!user) {
      logger.warn('No user authenticated');
      return null;
    }

    try {
      const token = await user.getIdToken(true); // Force refresh to avoid expired tokens
      return `Bearer ${token}`;
    } catch (error) {
      logger.error('Error getting auth token:', error);
      return null;
    }
  }, [user, loading]);

  /**
   * Store assessment data
   */
  const setAssessment = useCallback(
    async (
      assessment: AssessmentData,
      completionId: string
    ): Promise<boolean> => {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        logger.error('Not authenticated');
        return false;
      }

      try {
        const response = await fetch('/api/session/assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({ assessment, completionId }),
        });

        if (!response.ok) {
          logger.error('Failed to store assessment:', response.statusText);
          return false;
        }

        return true;
      } catch (error) {
        logger.error('Error storing assessment:', error);
        return false;
      }
    },
    [getAuthHeader]
  );

  /**
   * Get all session data
   */
  const getSession = useCallback(async (): Promise<SessionData | null> => {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      logger.error('Not authenticated');
      return null;
    }

    try {
      const response = await fetch('/api/session/get', {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        logger.error('Failed to get session:', response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }, [getAuthHeader]);

  /**
   * Clear all session data
   */
  const clearSession = useCallback(async (): Promise<boolean> => {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      logger.warn('Cannot clear session: user not authenticated');
      return false;
    }

    try {
      const response = await fetch('/api/session/clear', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        // If unauthorized, the session is effectively "cleared" since user can't access it
        if (response.status === 401) {
          logger.warn(
            'Session clear failed due to authentication - treating as cleared'
          );
          return true;
        }
        logger.error('Failed to clear session:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error clearing session:', error);
      return false;
    }
  }, [getAuthHeader]);

  return {
    setAssessment,
    getSession,
    clearSession,
  };
}
