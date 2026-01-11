'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  clearSession as clearSessionRequest,
  setAssessment as setAssessmentRequest,
  setConversationComplete as setConversationCompleteRequest,
  setConversationId as setConversationIdRequest,
} from '@/lib/api/session';
import type { AssessmentData } from '@/schemas/session.schema';
import { sessionKeys } from '@/hooks/queries/useSession';
import { logger } from '@/lib/logger';

/**
 * Mutation to store assessment data
 */
export function useSetAssessment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const getAuthToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return `Bearer ${await user.getIdToken(true)}`;
  };
  
  return useMutation({
    mutationFn: async (data: { assessment: AssessmentData; completionId: string }) => {
      return setAssessmentRequest(data, getAuthToken);
    },
    onSuccess: () => {
      // Invalidate session query to refetch updated data
      queryClient.invalidateQueries({ queryKey: sessionKeys.data() });
      logger.info('Assessment stored successfully');
    },
    onError: (error) => {
      logger.error('Failed to store assessment:', error);
    },
  });
}

/**
 * Mutation to set conversation ID
 */
export function useSetConversationId() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const getAuthToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return `Bearer ${await user.getIdToken(true)}`;
  };
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      return setConversationIdRequest(conversationId, getAuthToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.data() });
      logger.info('Conversation ID set successfully');
    },
    onError: (error) => {
      logger.error('Failed to set conversation ID:', error);
    },
  });
}

/**
 * Mutation to mark conversation as complete
 */
export function useSetConversationComplete() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const getAuthToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return `Bearer ${await user.getIdToken(true)}`;
  };
  
  return useMutation({
    mutationFn: async (complete: boolean) => {
      return setConversationCompleteRequest(complete, getAuthToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.data() });
      logger.info('Conversation status updated successfully');
    },
    onError: (error) => {
      logger.error('Failed to update conversation status:', error);
    },
  });
}

/**
 * Mutation to clear all session data
 */
export function useClearSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const getAuthToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return `Bearer ${await user.getIdToken()}`;
  };
  
  return useMutation({
    mutationFn: async () => {
      return clearSessionRequest(getAuthToken);
    },
    onSuccess: () => {
      // Clear the session data from cache
      queryClient.setQueryData(sessionKeys.data(), null);
      logger.info('Session cleared successfully');
    },
    onError: (error) => {
      logger.error('Failed to clear session:', error);
    },
  });
}
