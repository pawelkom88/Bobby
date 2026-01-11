'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { createQueryKeyFactory } from '@/lib/queryClient';
import {
  fetchConversationDetail,
  fetchConversations,
} from '@/lib/api/conversations';
import type { ConversationListItem } from '@/schemas/conversations.schema';

/**
 * Query key factory for conversation-related queries
 */
export const conversationKeys = createQueryKeyFactory('conversations');

/**
 * Hook to fetch the list of conversations for the current user
 *
 * Usage:
 * function ChatsPage() {
 *   const { data: conversations, isLoading, error } = useConversations();
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *   return <ConversationList conversations={conversations} />;
 * }
 */
export function useConversations() {
  const { user } = useAuth();

  const getAuthToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return `Bearer ${await user.getIdToken()}`;
  };

  return useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: () => fetchConversations(getAuthToken),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch a single conversation by ID
 *
 * Usage:
 * function ConversationDetail({ conversationId }: { conversationId: string }) {
 *   const { data: conversation, isLoading, error } = useConversation(conversationId);
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *   return <ConversationView conversation={conversation} />;
 * }
 */
export function useConversation(conversationId: string) {
  const { user } = useAuth();

  const getAuthToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return `Bearer ${await user.getIdToken()}`;
  };

  return useQuery({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: () => fetchConversationDetail(conversationId, getAuthToken),
    enabled: !!user && !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export type { ConversationListItem };
