/**
 * Ownership Validator
 * Validates that a user owns a conversation
 */

export interface OwnershipValidationResult {
  isOwner: boolean;
  userId: string;
  conversationId: string;
  reason?: 'owner' | 'not_owner' | 'conversation_not_found' | 'invalid_id';
}

export class OwnershipValidationError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'OwnershipValidationError';
  }
}

/**
 * Validates input IDs
 */
function validateIds(userId: string, conversationId: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new OwnershipValidationError(
      'auth/invalid-user-id',
      'Invalid or missing user ID'
    );
  }

  if (!conversationId || typeof conversationId !== 'string') {
    throw new OwnershipValidationError(
      'validation/invalid-conversation-id',
      'Invalid or missing conversation ID'
    );
  }
}

/**
 * Validates conversation ownership
 *
 * @param userId - The user ID to check
 * @param conversationId - The conversation ID to check
 * @param getConversationFn - Function to fetch conversation data
 * @returns Result indicating ownership status
 * @throws OwnershipValidationError if validation fails
 */
export async function validateOwnership(
  userId: string,
  conversationId: string,
  getConversationFn: (id: string) => Promise<any>
): Promise<OwnershipValidationResult> {
  // Validate inputs
  validateIds(userId, conversationId);

  try {
    // Fetch conversation
    const conversation = await getConversationFn(conversationId);

    // Check if conversation exists
    if (!conversation) {
      throw new OwnershipValidationError(
        'conversation/not-found',
        `Conversation ${conversationId} not found`
      );
    }

    // Check ownership
    const isOwner = conversation.userId === userId;

    if (!isOwner) {
      throw new OwnershipValidationError(
        'auth/not-authorized',
        'User does not own this conversation'
      );
    }

    return {
      isOwner: true,
      userId,
      conversationId,
      reason: 'owner',
    };
  } catch (error: any) {
    // If it's already our custom error, re-throw it
    if (error instanceof OwnershipValidationError) {
      throw error;
    }

    // Otherwise, wrap it
    throw new OwnershipValidationError(
      'validation/error',
      `Failed to validate ownership: ${error.message}`
    );
  }
}

/**
 * Simple boolean check for ownership
 *
 * @param userId - The user ID to check
 * @param conversationId - The conversation ID to check
 * @param getConversationFn - Function to fetch conversation data
 * @returns true if user owns conversation, false otherwise
 */
export async function isOwner(
  userId: string,
  conversationId: string,
  getConversationFn: (id: string) => Promise<any>
): Promise<boolean> {
  try {
    await validateOwnership(userId, conversationId, getConversationFn);
    return true;
  } catch {
    return false;
  }
}
