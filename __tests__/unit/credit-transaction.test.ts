/**
 * Credit Transaction Tests
 * Tests for atomic credit deduction with idempotency protection
 */

import { describe, it, expect, vi } from 'vitest';
import {
  deductCredit,
  CreditTransactionError,
  TransactionSimulator,
  validateTransactionConsistency,
  calculateExpectedCredits,
} from '@/lib/credit-transaction';
import { createUserWith5Credits, createUserWith0Credits } from '../fixtures/users';
import { createUnchargedConversation45Sec, createChargedConversation } from '../fixtures/conversations';

describe('Credit Transaction', () => {
  describe('Successful Deductions', () => {
    it('should_deduct_one_credit_successfully', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45;
      const currentCredits = 5;

      const deductCreditFn = vi.fn().mockResolvedValue(4);
      const recordDeductionFn = vi.fn().mockResolvedValue(undefined);

      const result = await deductCredit(
        userId,
        conversationId,
        durationSeconds,
        currentCredits,
        false,
        deductCreditFn,
        recordDeductionFn
      );

      expect(result.success).toBe(true);
      expect(result.newCredits).toBe(4);
      expect(result.charged).toBe(true);
      expect(deductCreditFn).toHaveBeenCalledWith(userId, 1);
    });

    it('should_set_charged_flag_to_true', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45;
      const currentCredits = 5;

      const deductCreditFn = vi.fn().mockResolvedValue(4);
      const recordDeductionFn = vi.fn().mockResolvedValue(undefined);

      const result = await deductCredit(
        userId,
        conversationId,
        durationSeconds,
        currentCredits,
        false,
        deductCreditFn,
        recordDeductionFn
      );

      expect(result.charged).toBe(true);
    });

    it('should_return_updated_credit_count', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45;
      const currentCredits = 5;

      const deductCreditFn = vi.fn().mockResolvedValue(4);
      const recordDeductionFn = vi.fn().mockResolvedValue(undefined);

      const result = await deductCredit(
        userId,
        conversationId,
        durationSeconds,
        currentCredits,
        false,
        deductCreditFn,
        recordDeductionFn
      );

      expect(result.newCredits).toBe(4);
      expect(result.newCredits).toBeLessThan(currentCredits);
    });

    it('should_record_deduction_for_audit_trail', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45;
      const currentCredits = 5;

      const deductCreditFn = vi.fn().mockResolvedValue(4);
      const recordDeductionFn = vi.fn().mockResolvedValue(undefined);

      await deductCredit(
        userId,
        conversationId,
        durationSeconds,
        currentCredits,
        false,
        deductCreditFn,
        recordDeductionFn
      );

      expect(recordDeductionFn).toHaveBeenCalledWith(
        conversationId,
        userId,
        durationSeconds,
        1
      );
    });
  });

  describe('Idempotency & Edge Cases', () => {
    it('should_prevent_deduction_when_already_charged', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45;
      const currentCredits = 5;

      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      await expect(
        deductCredit(
          userId,
          conversationId,
          durationSeconds,
          currentCredits,
          true, // Already charged
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow(CreditTransactionError);

      expect(deductCreditFn).not.toHaveBeenCalled();
      expect(recordDeductionFn).not.toHaveBeenCalled();
    });

    it('should_throw_error_when_already_charged', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45;
      const currentCredits = 5;

      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      try {
        await deductCredit(
          userId,
          conversationId,
          durationSeconds,
          currentCredits,
          true,
          deductCreditFn,
          recordDeductionFn
        );
      } catch (error: any) {
        expect(error.code).toBe('transaction/already-charged');
      }
    });

    it('should_handle_zero_credits_gracefully', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45;
      const currentCredits = 0;

      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      await expect(
        deductCredit(
          userId,
          conversationId,
          durationSeconds,
          currentCredits,
          false,
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow(CreditTransactionError);

      try {
        await deductCredit(
          userId,
          conversationId,
          durationSeconds,
          currentCredits,
          false,
          deductCreditFn,
          recordDeductionFn
        );
      } catch (error: any) {
        expect(error.code).toBe('payment/insufficient-credits');
      }
    });

    it('should_use_server_timestamps_not_client', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45; // Server-calculated, not client-provided
      const currentCredits = 5;

      const deductCreditFn = vi.fn().mockResolvedValue(4);
      const recordDeductionFn = vi.fn().mockResolvedValue(undefined);

      const result = await deductCredit(
        userId,
        conversationId,
        durationSeconds,
        currentCredits,
        false,
        deductCreditFn,
        recordDeductionFn
      );

      // Verify duration is passed to recording function
      expect(recordDeductionFn).toHaveBeenCalledWith(
        conversationId,
        userId,
        durationSeconds,
        1
      );

      expect(result.durationSeconds).toBe(durationSeconds);
    });
  });

  describe('Transaction Integrity', () => {
    it('should_rollback_on_partial_failure', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45;
      const currentCredits = 5;

      // Deduct succeeds but recording fails
      const deductCreditFn = vi.fn().mockResolvedValue(4);
      const recordDeductionFn = vi.fn().mockRejectedValue(
        new Error('Recording failed')
      );

      await expect(
        deductCredit(
          userId,
          conversationId,
          durationSeconds,
          currentCredits,
          false,
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow();

      // Both operations should have been attempted
      expect(deductCreditFn).toHaveBeenCalled();
      expect(recordDeductionFn).toHaveBeenCalled();
    });

    it('should_throw_transaction_error_on_failure', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      const durationSeconds = 45;
      const currentCredits = 5;

      const deductCreditFn = vi.fn().mockRejectedValue(new Error('DB error'));
      const recordDeductionFn = vi.fn();

      try {
        await deductCredit(
          userId,
          conversationId,
          durationSeconds,
          currentCredits,
          false,
          deductCreditFn,
          recordDeductionFn
        );
      } catch (error: any) {
        expect(error).toBeInstanceOf(CreditTransactionError);
        expect(error.code).toBe('transaction/failed');
      }
    });
  });

  describe('Input Validation', () => {
    it('should_reject_invalid_user_id', async () => {
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      await expect(
        deductCredit(
          '', // Invalid user ID
          'conv-456',
          45,
          5,
          false,
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow(CreditTransactionError);
    });

    it('should_reject_invalid_conversation_id', async () => {
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      await expect(
        deductCredit(
          'user-123',
          '', // Invalid conversation ID
          45,
          5,
          false,
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow(CreditTransactionError);
    });

    it('should_reject_negative_duration', async () => {
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      await expect(
        deductCredit(
          'user-123',
          'conv-456',
          -10, // Negative duration
          5,
          false,
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow(CreditTransactionError);
    });

    it('should_reject_negative_credits', async () => {
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      await expect(
        deductCredit(
          'user-123',
          'conv-456',
          45,
          -5, // Negative credits
          false,
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow(CreditTransactionError);
    });

    it('should_reject_null_user_id', async () => {
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      await expect(
        deductCredit(
          null as any,
          'conv-456',
          45,
          5,
          false,
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow(CreditTransactionError);
    });

    it('should_reject_null_conversation_id', async () => {
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      await expect(
        deductCredit(
          'user-123',
          null as any,
          45,
          5,
          false,
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow(CreditTransactionError);
    });
  });

  describe('Transaction Simulator', () => {
    it('should_track_operations', () => {
      const simulator = new TransactionSimulator();
      simulator.addOperation('deduct', { userId: 'user-123', amount: 1 });
      simulator.addOperation('record', { conversationId: 'conv-456' });

      const operations = simulator.getOperations();
      expect(operations).toHaveLength(2);
      expect(operations[0].type).toBe('deduct');
      expect(operations[1].type).toBe('record');
    });

    it('should_execute_successfully', async () => {
      const simulator = new TransactionSimulator();
      simulator.addOperation('deduct', { userId: 'user-123', amount: 1 });

      const result = await simulator.execute();
      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(1);
    });

    it('should_fail_when_configured', async () => {
      const simulator = new TransactionSimulator();
      simulator.setShouldFail(true);
      simulator.addOperation('deduct', { userId: 'user-123', amount: 1 });

      await expect(simulator.execute()).rejects.toThrow();
    });

    it('should_rollback_operations', () => {
      const simulator = new TransactionSimulator();
      simulator.addOperation('deduct', { userId: 'user-123', amount: 1 });
      simulator.rollback();

      const operations = simulator.getOperations();
      expect(operations).toHaveLength(0);
    });

    it('should_clear_state', () => {
      const simulator = new TransactionSimulator();
      simulator.setShouldFail(true);
      simulator.addOperation('deduct', { userId: 'user-123', amount: 1 });
      simulator.clear();

      expect(simulator.getOperations()).toHaveLength(0);
    });
  });

  describe('Transaction Consistency', () => {
    it('should_validate_consistency_after_single_deduction', () => {
      const initialCredits = 5;
      const finalCredits = 4;
      const deductionCount = 1;

      const isConsistent = validateTransactionConsistency(
        initialCredits,
        finalCredits,
        deductionCount
      );

      expect(isConsistent).toBe(true);
    });

    it('should_detect_inconsistency', () => {
      const initialCredits = 5;
      const finalCredits = 3; // Should be 4
      const deductionCount = 1;

      const isConsistent = validateTransactionConsistency(
        initialCredits,
        finalCredits,
        deductionCount
      );

      expect(isConsistent).toBe(false);
    });

    it('should_validate_multiple_deductions', () => {
      const initialCredits = 10;
      const finalCredits = 7; // 10 - 3 = 7
      const deductionCount = 3;

      const isConsistent = validateTransactionConsistency(
        initialCredits,
        finalCredits,
        deductionCount
      );

      expect(isConsistent).toBe(true);
    });
  });

  describe('Expected Credits Calculation', () => {
    it('should_calculate_credits_when_charging', () => {
      const currentCredits = 5;
      const expected = calculateExpectedCredits(currentCredits, true);

      expect(expected).toBe(4);
    });

    it('should_not_change_credits_when_not_charging', () => {
      const currentCredits = 5;
      const expected = calculateExpectedCredits(currentCredits, false);

      expect(expected).toBe(5);
    });

    it('should_handle_zero_credits', () => {
      const currentCredits = 0;
      const expected = calculateExpectedCredits(currentCredits, true);

      expect(expected).toBe(-1);
    });

    it('should_handle_large_credit_amounts', () => {
      const currentCredits = 1000;
      const expected = calculateExpectedCredits(currentCredits, true);

      expect(expected).toBe(999);
    });
  });

  describe('Error Handling', () => {
    it('should_throw_credit_transaction_error', async () => {
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      try {
        await deductCredit(
          'user-123',
          'conv-456',
          45,
          0, // Zero credits
          false,
          deductCreditFn,
          recordDeductionFn
        );
      } catch (error: any) {
        expect(error).toBeInstanceOf(CreditTransactionError);
        expect(error.name).toBe('CreditTransactionError');
      }
    });

    it('should_include_error_code', async () => {
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      try {
        await deductCredit(
          'user-123',
          'conv-456',
          45,
          0,
          false,
          deductCreditFn,
          recordDeductionFn
        );
      } catch (error: any) {
        expect(error).toHaveProperty('code');
        expect(error.code).toBeTruthy();
      }
    });

    it('should_include_error_message', async () => {
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      try {
        await deductCredit(
          'user-123',
          'conv-456',
          45,
          0,
          false,
          deductCreditFn,
          recordDeductionFn
        );
      } catch (error: any) {
        expect(error).toHaveProperty('message');
        expect(error.message).toBeTruthy();
      }
    });
  });

  describe('Integration with Fixtures', () => {
    it('should_work_with_user_fixture', async () => {
      const user = createUserWith5Credits();
      const deductCreditFn = vi.fn().mockResolvedValue(user.credits - 1);
      const recordDeductionFn = vi.fn().mockResolvedValue(undefined);

      const result = await deductCredit(
        user.id,
        'conv-456',
        45,
        user.credits,
        false,
        deductCreditFn,
        recordDeductionFn
      );

      expect(result.success).toBe(true);
      expect(result.newCredits).toBe(4);
    });

    it('should_work_with_conversation_fixture', async () => {
      const conversation = createUnchargedConversation45Sec();
      const deductCreditFn = vi.fn().mockResolvedValue(4);
      const recordDeductionFn = vi.fn().mockResolvedValue(undefined);

      const result = await deductCredit(
        conversation.userId,
        conversation.id,
        45,
        5,
        conversation.charged,
        deductCreditFn,
        recordDeductionFn
      );

      expect(result.success).toBe(true);
      expect(result.charged).toBe(true);
    });

    it('should_reject_already_charged_conversation', async () => {
      const conversation = createChargedConversation();
      const deductCreditFn = vi.fn();
      const recordDeductionFn = vi.fn();

      await expect(
        deductCredit(
          conversation.userId,
          conversation.id,
          45,
          5,
          conversation.charged,
          deductCreditFn,
          recordDeductionFn
        )
      ).rejects.toThrow(CreditTransactionError);
    });
  });
});
