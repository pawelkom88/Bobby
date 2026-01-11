'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  deductCredits,
  endConversation,
  startConversation,
} from '@/lib/api/conversation';
import type {
  EndConversationRequest,
  StartConversationRequest,
} from '@/schemas/conversation.schema';

export function useStartConversation() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: StartConversationRequest) => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      const token = await user.getIdToken();
      return startConversation(request, token);
    },
  });
}

export function useEndConversation() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: EndConversationRequest) => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      const token = await user.getIdToken();
      return endConversation(request, token);
    },
  });
}

export function useDeductCredits() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      const token = await user.getIdToken();
      return deductCredits(conversationId, token);
    },
  });
}
