/**
 * Conversation storage utilities
 * Handles fetching and managing conversation data from Firestore
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { StoredConversation, ConversationListItem } from '@/types';

const db = getAdminDb();

/**
 * Fetch a single conversation by ID
 */
export async function getConversationById(
  conversationId: string
): Promise<StoredConversation | null> {
  try {
    const doc = await db.collection('conversations').doc(conversationId).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      userId: data?.userId || '',
      ageTier: data?.ageTier || 1,
      service: data?.service || 'fire',
      startedAt: data?.startedAt || '',
      endedAt: data?.endedAt,
      status: data?.status || 'active',
      charged: data?.charged || false,
      messages: data?.messages || [],
    } as StoredConversation;
  } catch (error) {
    logger.error('Error fetching conversation:', error);
    throw error;
  }
}

/**
 * Fetch all conversations for a user (list view - without full messages)
 */
export async function getConversationsForUser(
  userId: string,
  limit: number = 50
): Promise<ConversationListItem[]> {
  try {
    const snapshot = await db
      .collection('conversations')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      // .orderBy('endedAt', 'desc') // Temporarily commented out while index builds
      .limit(limit)
      .get();

    const conversations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        service: data.service || 'fire',
        ageTier: data.ageTier || 1,
        startedAt: data.startedAt || '',
        endedAt: data.endedAt,
        messageCount: data.messages?.length || 0,
      } as ConversationListItem;
    });

    // Filter out conversations with no messages and sort
    const conversationsWithMessages = conversations.filter(conv => conv.messageCount > 0);
    
    return conversationsWithMessages.sort((a, b) => {
      const aTime = new Date(a.endedAt || a.startedAt).getTime();
      const bTime = new Date(b.endedAt || b.startedAt).getTime();
      return bTime - aTime; // Descending order
    });
  } catch (error) {
    logger.error('Error fetching conversations for user:', error);
    throw error;
  }
}

/**
 * Check if a user owns a conversation
 */
export async function userOwnsConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    const conversation = await getConversationById(conversationId);
    return conversation?.userId === userId;
  } catch (error) {
    logger.error('Error checking conversation ownership:', error);
    return false;
  }
}
