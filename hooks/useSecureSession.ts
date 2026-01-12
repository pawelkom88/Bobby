'use client';

import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';
import {
  clearSession as clearSessionRequest,
  fetchSession as fetchSessionRequest,
  setAssessment as setAssessmentRequest,
  setConversationComplete as setConversationCompleteRequest,
  setConversationId as setConversationIdRequest,
} from '@/lib/api/session';
import type { AssessmentData, SessionData } from '@/schemas/session.schema';
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
        await setAssessmentRequest(
          { assessment, completionId },
          () => Promise.resolve(authHeader)
        );
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
        return await fetchSessionRequest(() => Promise.resolve(authHeader));
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
        await clearSessionRequest(() => Promise.resolve(authHeader));
        return true;
      } catch (error: unknown) {
        const errorStatus =
          typeof error === 'object' && error !== null && 'status' in error
            ? (error as { status?: number }).status
            : undefined;

        if (errorStatus === 401) {
          logger.warn(
            'Session clear failed due to authentication - treating as cleared'
          );
          return true;
        }
        logger.error('Error clearing session:', error);
        return false;
      }
  }, [getAuthHeader]);

  /**
   * Mark conversation as complete (sets 24-hour expiration)
   */
  const setConversationComplete = useCallback(
    async (complete: boolean): Promise<boolean> => {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        logger.error('Not authenticated');
        return false;
      }

      try {
        await setConversationCompleteRequest(
          complete,
          () => Promise.resolve(authHeader)
        );
        return true;
      } catch (error) {
        logger.error('Error setting conversation complete:', error);
        return false;
      }
    },
    [getAuthHeader]
  );

  /**
   * Set conversation ID in session
   */
  const setConversationId = useCallback(
    async (conversationId: string): Promise<boolean> => {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        logger.error('Not authenticated');
        return false;
      }

      try {
        await setConversationIdRequest(
          conversationId,
          () => Promise.resolve(authHeader)
        );
        return true;
      } catch (error) {
        logger.error('Error setting conversation ID:', error);
        return false;
      }
    },
    [getAuthHeader]
  );

  return {
    setAssessment,
    getSession,
    clearSession,
    setConversationComplete,
    setConversationId,
  };
}
