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
  const { user } = useAuth();

  const getAuthHeader = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const token = await user.getIdToken(true); // Force refresh to avoid expired tokens
      return `Bearer ${token}`;
    } catch (error) {
      logger.error('Error getting auth token:', error);
      return null;
    }
  }, [user]);

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
