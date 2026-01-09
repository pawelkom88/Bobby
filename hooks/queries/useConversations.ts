'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { createQueryKeyFactory } from '@/lib/queryClient';
import type { ConversationListItem } from '@/types';

/**
 * Query key factory for conversation-related queries
 */
export const conversationKeys = createQueryKeyFactory('conversations');

/**
 * Response type for conversations API
 */
interface ConversationsResponse {
  success: boolean;
  conversations?: ConversationListItem[];
  message?: string;
}

/**
 * Fetcher function for conversations list
 */
async function fetchConversations(
  getAuthToken: () => Promise<string>
): Promise<ConversationListItem[]> {
  const token = await getAuthToken();
  const response = await fetch('/api/conversations', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load conversations');
  }

  const data: ConversationsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to load conversations');
  }

  return data.conversations || [];
}

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
    return user.getIdToken();
  };

  return useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: () => fetchConversations(getAuthToken),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetcher function for a single conversation
 */
async function fetchConversation(
  conversationId: string,
  getAuthToken: () => Promise<string>
): Promise<ConversationListItem> {
  const token = await getAuthToken();
  const response = await fetch(`/api/conversations/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load conversation');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to load conversation');
  }

  return data.conversation;
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
    return user.getIdToken();
  };

  return useQuery({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: () => fetchConversation(conversationId, getAuthToken),
    enabled: !!user && !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
