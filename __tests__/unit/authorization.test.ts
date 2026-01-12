/**
 * Authorization Tests
 * Tests for conversation ownership validation
 */

import { describe, it, expect, vi } from 'vitest';
import {
  validateOwnership,
  isOwner,
  OwnershipValidationError,
} from '@/lib/ownership-validator';
import {
  createConversation,
  createUnchargedConversation45Sec,
} from '../fixtures/conversations';
import { createUser, createUserWith5Credits } from '../fixtures/users';

describe('Authorization - Ownership Validation', () => {
  describe('Ownership Validation', () => {
    it('should_allow_access_when_user_owns_conversation', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId,
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      const result = await validateOwnership(userId, conversationId, getConversationFn);

      expect(result.isOwner).toBe(true);
      expect(result.reason).toBe('owner');
      expect(result.userId).toBe(userId);
      expect(result.conversationId).toBe(conversationId);
    });

    it('should_deny_access_when_user_does_not_own_conversation', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId: 'user-999', // Different owner
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      await expect(
        validateOwnership(userId, conversationId, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);

      try {
        await validateOwnership(userId, conversationId, getConversationFn);
      } catch (error: unknown) {
        expect((error as OwnershipValidationError).code).toBe('auth/not-authorized');
      }
    });

    it('should_deny_access_when_conversation_not_found', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-nonexistent';

      const getConversationFn = vi.fn().mockResolvedValue(null);

      await expect(
        validateOwnership(userId, conversationId, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);

      try {
        await validateOwnership(userId, conversationId, getConversationFn);
      } catch (error: unknown) {
        expect((error as OwnershipValidationError).code).toBe('conversation/not-found');
      }
    });

    it('should_deny_access_when_conversation_id_is_invalid', async () => {
      const userId = 'user-123';
      const getConversationFn = vi.fn();

      await expect(
        validateOwnership(userId, '', getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);

      try {
        await validateOwnership(userId, '', getConversationFn);
      } catch (error: unknown) {
        expect((error as OwnershipValidationError).code).toBe('validation/invalid-conversation-id');
      }
    });

    it('should_deny_access_when_user_id_is_invalid', async () => {
      const conversationId = 'conv-456';
      const getConversationFn = vi.fn();

      await expect(
        validateOwnership('', conversationId, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);

      try {
        await validateOwnership('', conversationId, getConversationFn);
      } catch (error: unknown) {
        expect((error as OwnershipValidationError).code).toBe('auth/invalid-user-id');
      }
    });

    it('should_deny_access_when_user_id_is_null', async () => {
      const conversationId = 'conv-456';
      const getConversationFn = vi.fn();

      await expect(
        validateOwnership(null as any, conversationId, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);
    });

    it('should_deny_access_when_conversation_id_is_null', async () => {
      const userId = 'user-123';
      const getConversationFn = vi.fn();

      await expect(
        validateOwnership(userId, null as any, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);
    });
  });

  describe('Conversation Existence Check', () => {
    it('should_call_get_conversation_function', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId,
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      await validateOwnership(userId, conversationId, getConversationFn);

      expect(getConversationFn).toHaveBeenCalledWith(conversationId);
      expect(getConversationFn).toHaveBeenCalledTimes(1);
    });

    it('should_handle_conversation_fetch_error', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const error = new Error('Database connection failed');

      const getConversationFn = vi.fn().mockRejectedValue(error);

      await expect(
        validateOwnership(userId, conversationId, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);

      try {
        await validateOwnership(userId, conversationId, getConversationFn);
      } catch (error: unknown) {
        expect((error as OwnershipValidationError).code).toBe('validation/error');
      }
    });
  });

  describe('Result Structure', () => {
    it('should_include_ownership_status_in_result', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId,
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      const result = await validateOwnership(userId, conversationId, getConversationFn);

      expect(result).toHaveProperty('isOwner');
      expect(typeof result.isOwner).toBe('boolean');
    });

    it('should_include_user_and_conversation_ids_in_result', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId,
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      const result = await validateOwnership(userId, conversationId, getConversationFn);

      expect(result.userId).toBe(userId);
      expect(result.conversationId).toBe(conversationId);
    });

    it('should_include_reason_in_result', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId,
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      const result = await validateOwnership(userId, conversationId, getConversationFn);

      expect(result).toHaveProperty('reason');
      expect(result.reason).toBe('owner');
    });
  });

  describe('Simple Boolean Check', () => {
    it('should_return_true_when_user_owns_conversation', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId,
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      const result = await isOwner(userId, conversationId, getConversationFn);

      expect(result).toBe(true);
    });

    it('should_return_false_when_user_does_not_own_conversation', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId: 'user-999',
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      const result = await isOwner(userId, conversationId, getConversationFn);

      expect(result).toBe(false);
    });

    it('should_return_false_when_conversation_not_found', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';

      const getConversationFn = vi.fn().mockResolvedValue(null);

      const result = await isOwner(userId, conversationId, getConversationFn);

      expect(result).toBe(false);
    });

    it('should_return_false_when_ids_are_invalid', async () => {
      const getConversationFn = vi.fn();

      const result = await isOwner('', 'conv-456', getConversationFn);

      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should_throw_ownership_validation_error', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId: 'user-999',
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      try {
        await validateOwnership(userId, conversationId, getConversationFn);
        expect.fail('Should have thrown error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OwnershipValidationError);
        expect((error as OwnershipValidationError).name).toBe('OwnershipValidationError');
      }
    });

    it('should_include_error_code_in_exception', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId: 'user-999',
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      try {
        await validateOwnership(userId, conversationId, getConversationFn);
      } catch (error: unknown) {
        expect(error).toHaveProperty('code');
        expect((error as OwnershipValidationError).code).toBeTruthy();
      }
    });
  });

  describe('Integration with Fixtures', () => {
    it('should_validate_ownership_with_fixture_conversation', async () => {
      const userId = 'user-123';
      const conversation = createUnchargedConversation45Sec({
        userId,
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      const result = await validateOwnership(userId, conversation.id, getConversationFn);

      expect(result.isOwner).toBe(true);
    });

    it('should_handle_multiple_users_and_conversations', async () => {
      const users = ['user-1', 'user-2', 'user-3'];
      const conversations = users.map((userId) =>
        createConversation({
          id: `conv-${userId}`,
          userId,
        })
      );

      for (let i = 0; i < users.length; i++) {
        const userId = users[i];
        const conversation = conversations[i];
        const getConversationFn = vi.fn().mockResolvedValue(conversation);

        const result = await validateOwnership(userId, conversation.id, getConversationFn);

        expect(result.isOwner).toBe(true);
      }
    });

    it('should_deny_access_across_users', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const conversation = createConversation({
        id: 'conv-123',
        userId: user1,
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      // User 1 should have access
      const result1 = await validateOwnership(user1, conversation.id, getConversationFn);
      expect(result1.isOwner).toBe(true);

      // User 2 should not have access
      await expect(
        validateOwnership(user2, conversation.id, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);
    });
  });

  describe('Edge Cases', () => {
    it('should_handle_conversation_with_empty_user_id', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId: '', // Empty user ID
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      await expect(
        validateOwnership(userId, conversationId, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);
    });

    it('should_handle_conversation_with_null_user_id', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = {
        id: conversationId,
        userId: null, // Null user ID
      };

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      await expect(
        validateOwnership(userId, conversationId, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);
    });

    it('should_be_case_sensitive_for_user_ids', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const conversation = createConversation({
        id: conversationId,
        userId: 'User-123', // Different case
      });

      const getConversationFn = vi.fn().mockResolvedValue(conversation);

      await expect(
        validateOwnership(userId, conversationId, getConversationFn)
      ).rejects.toThrow(OwnershipValidationError);
    });
  });
});
