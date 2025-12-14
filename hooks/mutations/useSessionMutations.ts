'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/fetcher';
import { 
  SessionSetResponseSchema,
  SetAssessmentRequestSchema,
  SetConversationIdRequestSchema,
  SetConversationCompleteRequestSchema,
  type AssessmentData,
  type SetAssessmentRequest,
  type SetConversationIdRequest,
  type SetConversationCompleteRequest
} from '@/schemas/session.schema';
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
      const request: SetAssessmentRequest = {
        assessment: data.assessment,
        completionId: data.completionId,
      };
      
      const response = await authenticatedFetch(
        '/api/session/assessment',
        SessionSetResponseSchema,
        getAuthToken,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to store assessment');
      }
      
      return response;
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
      const request: SetConversationIdRequest = {
        conversationId,
      };
      
      const response = await authenticatedFetch(
        '/api/session/conversation-id',
        SessionSetResponseSchema,
        getAuthToken,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to set conversation ID');
      }
      
      return response;
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
      const request: SetConversationCompleteRequest = {
        complete,
      };
      
      const response = await authenticatedFetch(
        '/api/session/complete',
        SessionSetResponseSchema,
        getAuthToken,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update conversation status');
      }
      
      return response;
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
      const response = await authenticatedFetch(
        '/api/session/clear',
        SessionSetResponseSchema,
        getAuthToken,
        {
          method: 'POST',
        }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to clear session');
      }
      
      return response;
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
