'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { createQueryKeyFactory } from '@/lib/queryClient';
import { fetchAssessedConversations } from '@/lib/api/conversations';
import type { AssessedConversation } from '@/schemas/conversations.schema';

export const assessedConversationKeys = createQueryKeyFactory(
  'assessedConversations'
);

export function useAssessedConversations(limit?: number) {
  const { user } = useAuth();

  const getAuthToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return `Bearer ${await user.getIdToken()}`;
  };

  return useQuery<AssessedConversation[]>({
    queryKey: assessedConversationKeys.list({ limit }),
    queryFn: () => fetchAssessedConversations(getAuthToken, limit),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}
