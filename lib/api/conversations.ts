import { authenticatedFetch } from '@/lib/fetcher';
import {
  ConversationsListResponseSchema,
  ConversationDetailResponseSchema,
  AssessedConversationsResponseSchema,
} from '@/schemas/conversations.schema';
import type {
  ConversationListItem,
  StoredConversation,
  AssessedConversation,
} from '@/schemas/conversations.schema';

export async function fetchConversations(
  getAuthToken: () => Promise<string | null>,
  limit?: number
): Promise<ConversationListItem[]> {
  const url = limit ? `/api/conversations?limit=${limit}` : '/api/conversations';
  const response = await authenticatedFetch(
    url,
    ConversationsListResponseSchema,
    getAuthToken
  );

  if (!response.success) {
    throw new Error(response.message || 'Failed to load conversations');
  }

  return response.conversations || [];
}

export async function fetchConversationDetail(
  conversationId: string,
  getAuthToken: () => Promise<string | null>
): Promise<StoredConversation> {
  const response = await authenticatedFetch(
    `/api/conversations/${conversationId}`,
    ConversationDetailResponseSchema,
    getAuthToken
  );

  if (!response.success || !response.conversation) {
    throw new Error(response.message || 'Failed to load conversation');
  }

  return response.conversation;
}

export async function fetchAssessedConversations(
  getAuthToken: () => Promise<string | null>,
  limit?: number
): Promise<AssessedConversation[]> {
  const url = limit
    ? `/api/conversations/assessed?limit=${limit}`
    : '/api/conversations/assessed';

  const response = await authenticatedFetch(
    url,
    AssessedConversationsResponseSchema,
    getAuthToken
  );

  if (!response.success) {
    throw new Error(response.message || 'Failed to load training history');
  }

  return response.conversations || [];
}
