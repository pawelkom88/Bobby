/**
 * Hook for credit deduction flow
 * Handles conversation start, end, and credit deduction
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logger } from '@/lib/logger';
import type { ConversationMessage } from '@/types';

export interface CreditDeductionState {
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  newCredits: number | null;
  charged: boolean;
}

export interface StartConversationResponse {
  conversationId: string;
  startedAt: string;
  status: string;
  error?: string;
  message?: string;
}

export interface EndConversationResponse {
  conversationId: string;
  endedAt: string;
  status: string;
  error?: string;
  message?: string;
}

export interface DeductCreditsResponse {
  success: boolean;
  newCredits?: number;
  charged?: boolean;
  durationSeconds?: number;
  error?: string;
  message?: string;
}

/**
 * Hook for managing credit deduction flow
 */
export function useCreditDeduction() {
  const { user } = useAuth();
  const [state, setState] = useState<CreditDeductionState>({
    conversationId: null,
    isLoading: false,
    error: null,
    newCredits: null,
    charged: false,
  });

  /**
   * Get Firebase ID token
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) {
      logger.warn('User not authenticated');
      return null;
    }

    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      logger.error('Failed to get ID token:', error);
      return null;
    }
  }, [user]);

  /**
   * Start a conversation
   */
  const startConversation = useCallback(
    async (ageTier: 1 | 2 | 3, service: 'fire' | 'ambulance' | 'police') => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: 'User not authenticated',
        }));
        return null;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Failed to get authentication token');
        }

        const response = await fetch('/api/conversation/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ageTier,
            service,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as StartConversationResponse;
          throw new Error(errorData.message || 'Failed to start conversation');
        }

        const data = (await response.json()) as StartConversationResponse;

        logger.log(`Conversation started: ${data.conversationId}`);

        setState((prev) => ({
          ...prev,
          conversationId: data.conversationId,
          isLoading: false,
          error: null,
        }));

        return data.conversationId;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error starting conversation:', message);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));

        return null;
      }
    },
    [user, getToken]
  );

  /**
   * End a conversation and save messages
   */
  const endConversation = useCallback(
    async (conversationId: string, messages?: ConversationMessage[]) => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: 'User not authenticated',
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Failed to get authentication token');
        }

        const response = await fetch('/api/conversation/end', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId,
            messages,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as EndConversationResponse;
          throw new Error(errorData.message || 'Failed to end conversation');
        }

        const data = (await response.json()) as EndConversationResponse;

        logger.log(`Conversation ended: ${data.conversationId}`);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error ending conversation:', message);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));

        return false;
      }
    },
    [user, getToken]
  );

  /**
   * Deduct credits for a conversation
   */
  const deductCredits = useCallback(
    async (conversationId: string) => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: 'User not authenticated',
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Failed to get authentication token');
        }

        const response = await fetch('/api/deduct-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId,
          }),
        });

        const data = (await response.json()) as DeductCreditsResponse;

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 402) {
            throw new Error('Insufficient credits');
          }
          if (response.status === 403) {
            throw new Error('Not authorized to deduct credits for this conversation');
          }
          if (response.status === 404) {
            throw new Error('Conversation not found');
          }
          throw new Error(data.message || 'Failed to deduct credits');
        }

        // Handle expected errors (already charged, duration too short)
        if (!data.success) {
          logger.log(`Credit deduction not applied: ${data.error}`);
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: null, // Not an error, just not eligible
            newCredits: data.newCredits ?? null,
            charged: false,
          }));
          return false;
        }

        logger.log(`Credits deducted successfully. New balance: ${data.newCredits}`);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
          newCredits: data.newCredits ?? null,
          charged: data.charged ?? false,
        }));

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error deducting credits:', message);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));

        return false;
      }
    },
    [user, getToken]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      conversationId: null,
      isLoading: false,
      error: null,
      newCredits: null,
      charged: false,
    });
  }, []);

  return {
    state,
    startConversation,
    endConversation,
    deductCredits,
    reset,
  };
}
