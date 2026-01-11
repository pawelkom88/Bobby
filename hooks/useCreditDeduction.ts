/**
 * Hook for credit deduction flow
 * Handles conversation start, end, and credit deduction
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api/errors';
import {
  useDeductCredits,
  useEndConversation,
  useStartConversation,
} from '@/hooks/mutations/useConversationMutations';
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

const ACTIVE_CONVERSATION_KEY = 'bobby_active_conversation_id';

function getConversationStorageKey(userId?: string | null): string | null {
  if (!userId) {
    return null;
  }
  return `${ACTIVE_CONVERSATION_KEY}:${userId}`;
}

function getStoredConversationId(userId?: string | null): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const key = getConversationStorageKey(userId);
  if (!key) {
    return null;
  }
  return window.sessionStorage.getItem(key);
}

function setStoredConversationId(
  userId: string,
  conversationId: string
): void {
  if (typeof window === 'undefined') {
    return;
  }
  const key = getConversationStorageKey(userId);
  if (!key) {
    return;
  }
  window.sessionStorage.setItem(key, conversationId);
}

function clearStoredConversationId(userId?: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  const key = getConversationStorageKey(userId);
  if (!key) {
    return;
  }
  window.sessionStorage.removeItem(key);
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
  const startConversationMutation = useStartConversation();
  const endConversationMutation = useEndConversation();
  const deductCreditsMutation = useDeductCredits();

  // Restore active conversation ID for this session if it exists
  useEffect(() => {
    if (!user?.uid || state.conversationId) {
      return;
    }
    const storedConversationId = getStoredConversationId(user.uid);
    if (storedConversationId) {
      setState((prev) => ({
        ...prev,
        conversationId: storedConversationId,
      }));
    }
  }, [user?.uid, state.conversationId]);

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

      if (state.conversationId) {
        return state.conversationId;
      }

      const storedConversationId = getStoredConversationId(user.uid);
      if (storedConversationId) {
        setState((prev) => ({
          ...prev,
          conversationId: storedConversationId,
          isLoading: false,
          error: null,
        }));
        return storedConversationId;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        logger.log('[useCreditDeduction] Starting conversation');

        startConversationMutation.reset();
        const data = await startConversationMutation.mutateAsync({
          ageTier,
          service,
        });

        logger.log(`Conversation started: ${data.conversationId}`);
        setStoredConversationId(user.uid, data.conversationId);

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
    [user, state.conversationId, startConversationMutation]
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
        endConversationMutation.reset();
        const data = await endConversationMutation.mutateAsync({
          conversationId,
          messages,
        });

        logger.log(`Conversation ended: ${data.conversationId}`);
        clearStoredConversationId(user.uid);

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
    [user, endConversationMutation]
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
        deductCreditsMutation.reset();
        const data = await deductCreditsMutation.mutateAsync(conversationId);

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
        let message = error instanceof Error ? error.message : 'Unknown error';
        if (error instanceof ApiError) {
          if (error.status === 402) {
            message = 'Insufficient credits';
          } else if (error.status === 403) {
            message =
              'Not authorized to deduct credits for this conversation';
          } else if (error.status === 404) {
            message = 'Conversation not found';
          }
        }
        logger.error('Error deducting credits:', message);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));

        return false;
      }
    },
    [user, deductCreditsMutation]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    clearStoredConversationId(user?.uid);
    setState({
      conversationId: null,
      isLoading: false,
      error: null,
      newCredits: null,
      charged: false,
    });
  }, [user?.uid]);

  return {
    state,
    startConversation,
    endConversation,
    deductCredits,
    reset,
  };
}
