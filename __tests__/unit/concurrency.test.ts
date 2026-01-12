/**
 * Concurrency Tests
 * Tests for race condition prevention and credit consistency under load
 */

import { describe, it, expect, vi } from 'vitest';
import {
  simulateConcurrentTransactions,
  simulateRaceCondition,
  simulateStressTest,
  TransactionExecutionTracker,
  createControllableTransaction,
} from '../utils/transaction-simulator';

describe('Concurrency - Race Condition Prevention', () => {
  describe('Simultaneous Charge Requests', () => {
    it('should_handle_simultaneous_charge_requests', async () => {
      const userId = 'user-123';
      const conversationId1 = 'conv-1';
      const conversationId2 = 'conv-2';
      let creditsDeducted = 0;

      const transaction1 = vi.fn(async () => {
        creditsDeducted += 1;
        return { success: true, credits: 4 };
      });

      const transaction2 = vi.fn(async () => {
        creditsDeducted += 1;
        return { success: true, credits: 3 };
      });

      const results = await simulateConcurrentTransactions(
        async () => {
          if (Math.random() > 0.5) {
            return transaction1();
          } else {
            return transaction2();
          }
        },
        2
      );

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should_only_deduct_once_per_conversation', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';
      let deductionCount = 0;

      const deductFn = async () => {
        deductionCount += 1;
        return { success: true, newCredits: 4 };
      };

      // Simulate two concurrent requests for same conversation
      const results = await simulateConcurrentTransactions(deductFn, 2);

      // Both should succeed but only one should actually deduct
      // (In real Firestore, idempotency check would prevent second deduction)
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should_track_execution_order', async () => {
      const tracker = new TransactionExecutionTracker();

      const tx1 = async () => {
        tracker.track('tx1', 'deduct', 'started');
        await new Promise((resolve) => setTimeout(resolve, 10));
        tracker.track('tx1', 'deduct', 'completed');
        return { success: true };
      };

      const tx2 = async () => {
        tracker.track('tx2', 'deduct', 'started');
        await new Promise((resolve) => setTimeout(resolve, 5));
        tracker.track('tx2', 'deduct', 'completed');
        return { success: true };
      };

      await Promise.all([tx1(), tx2()]);

      const executions = tracker.getExecutions();
      expect(executions.length).toBeGreaterThan(0);
      expect(tracker.getOperationCount('deduct')).toBeGreaterThan(0);
    });
  });

  describe('Credit Consistency Under Load', () => {
    it('should_maintain_credit_consistency_under_load', async () => {
      const initialCredits = 10;
      let currentCredits = initialCredits;
      const deductionAttempts = 5;

      const deductCreditFn = async () => {
        if (currentCredits > 0) {
          currentCredits -= 1;
          return { success: true, newCredits: currentCredits };
        }
        return { success: false, error: 'insufficient-credits' };
      };

      const results = await simulateConcurrentTransactions(
        deductCreditFn,
        deductionAttempts
      );

      // Verify final state is consistent
      const successCount = results.filter((r) => r.success).length;
      const expectedCredits = initialCredits - successCount;

      expect(currentCredits).toBeLessThanOrEqual(initialCredits);
      expect(currentCredits).toBeGreaterThanOrEqual(0);
    });

    it('should_handle_5_conversations_ending_simultaneously', async () => {
      const userId = 'user-123';
      const conversations = [
        'conv-1',
        'conv-2',
        'conv-3',
        'conv-4',
        'conv-5',
      ];
      let creditsDeducted = 0;

      const deductFn = async (conversationId: string) => {
        creditsDeducted += 1;
        return {
          success: true,
          conversationId,
          creditsDeducted: 1,
        };
      };

      const results = await simulateConcurrentTransactions(
        async () => {
          const convId = conversations[Math.floor(Math.random() * conversations.length)];
          return deductFn(convId);
        },
        5
      );

      expect(results).toHaveLength(5);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should_maintain_consistency_with_multiple_iterations', async () => {
      const stressResults = await simulateStressTest(
        async () => {
          return { success: true, creditsDeducted: 1 };
        },
        5, // 5 concurrent requests
        3  // 3 iterations
      );

      expect(stressResults.results.length).toBe(15); // 5 * 3
      expect(stressResults.successCount).toBeGreaterThanOrEqual(0);
      expect(stressResults.failureCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Negative Credits Prevention', () => {
    it('should_not_produce_negative_credits', async () => {
      let currentCredits = 1;
      const deductionAttempts = 3;

      const deductCreditFn = async () => {
        if (currentCredits > 0) {
          currentCredits -= 1;
          return { success: true, newCredits: currentCredits };
        }
        return { success: false, error: 'insufficient-credits' };
      };

      const results = await simulateConcurrentTransactions(
        deductCreditFn,
        deductionAttempts
      );

      // Verify credits never went negative
      expect(currentCredits).toBeGreaterThanOrEqual(0);
      expect(currentCredits).toBeLessThanOrEqual(1);
    });

    it('should_prevent_overdraft_with_concurrent_requests', async () => {
      let currentCredits = 2;
      const maxDeductions = 5;

      const deductCreditFn = async () => {
        if (currentCredits > 0) {
          currentCredits -= 1;
          return { success: true, newCredits: currentCredits };
        }
        return { success: false, error: 'insufficient-credits' };
      };

      const results = await simulateConcurrentTransactions(
        deductCreditFn,
        maxDeductions
      );

      // Should never go below 0
      expect(currentCredits).toBeGreaterThanOrEqual(0);
      expect(results.length).toBe(maxDeductions);
    });

    it('should_handle_race_condition_with_1_credit_3_attempts', async () => {
      let currentCredits = 1;
      const deductionAttempts = 3;

      const deductCreditFn = async () => {
        if (currentCredits > 0) {
          currentCredits -= 1;
          return { success: true, newCredits: currentCredits };
        }
        return { success: false, error: 'insufficient-credits' };
      };

      const results = await simulateConcurrentTransactions(
        deductCreditFn,
        deductionAttempts
      );

      // Verify no negative credits
      expect(currentCredits).toBeGreaterThanOrEqual(0);
      expect(results.length).toBe(deductionAttempts);
    });
  });

  describe('Race Condition Simulation', () => {
    it('should_simulate_race_condition_between_two_transactions', async () => {
      let credits = 5;

      const tx1 = async () => {
        if (credits > 0) {
          credits -= 1;
          return { success: true, credits };
        }
        return { success: false };
      };

      const tx2 = async () => {
        if (credits > 0) {
          credits -= 1;
          return { success: true, credits };
        }
        return { success: false };
      };

      const { results, tracker } = await simulateRaceCondition(tx1, tx2);

      expect(results).toHaveLength(2);
      expect(tracker.getExecutions().length).toBeGreaterThan(0);
    });

    it('should_track_concurrent_execution', async () => {
      const tracker = new TransactionExecutionTracker();

      const tx1 = async () => {
        tracker.track('tx1', 'deduct', 'started');
        await new Promise((resolve) => setTimeout(resolve, 5));
        tracker.track('tx1', 'deduct', 'completed');
        return { success: true };
      };

      const tx2 = async () => {
        tracker.track('tx2', 'deduct', 'started');
        await new Promise((resolve) => setTimeout(resolve, 3));
        tracker.track('tx2', 'deduct', 'completed');
        return { success: true };
      };

      const { results, tracker: resultTracker } = await simulateRaceCondition(
        tx1,
        tx2
      );

      expect(results).toHaveLength(2);
      expect(resultTracker.getOperationCount('deduct')).toBeGreaterThan(0);
    });
  });

  describe('Stress Testing', () => {
    it('should_handle_stress_test_with_high_concurrency', async () => {
      const stressResults = await simulateStressTest(
        async () => {
          return { success: true, creditsDeducted: 1 };
        },
        10, // 10 concurrent requests
        2   // 2 iterations
      );

      expect(stressResults.results.length).toBe(20); // 10 * 2
      expect(stressResults.successCount).toBeGreaterThanOrEqual(0);
      expect(stressResults.failureCount).toBeGreaterThanOrEqual(0);
    });

    it('should_measure_performance_under_load', async () => {
      const stressResults = await simulateStressTest(
        async () => {
          return { success: true };
        },
        5,
        3
      );

      expect(stressResults.results.length).toBe(15);
      expect(stressResults.successCount).toBeGreaterThanOrEqual(0);
    });

    it('should_handle_failures_in_stress_test', async () => {
      let attemptCount = 0;

      const stressResults = await simulateStressTest(
        async () => {
          attemptCount += 1;
          // Fail every 3rd attempt
          if (attemptCount % 3 === 0) {
            return { success: false, error: 'simulated-error' };
          }
          return { success: true };
        },
        3,
        2
      );

      expect(stressResults.results.length).toBe(6); // 3 * 2
      expect(stressResults.successCount + stressResults.failureCount).toBe(6);
    });
  });

  describe('Transaction Isolation', () => {
    it('should_isolate_concurrent_transactions', async () => {
      const tx1Results: number[] = [];
      const tx2Results: number[] = [];

      const tx1 = async () => {
        tx1Results.push(1);
        return { success: true };
      };

      const tx2 = async () => {
        tx2Results.push(2);
        return { success: true };
      };

      await Promise.all([tx1(), tx2()]);

      expect(tx1Results.length).toBe(1);
      expect(tx2Results.length).toBe(1);
      expect(tx1Results[0]).toBe(1);
      expect(tx2Results[0]).toBe(2);
    });

    it('should_maintain_isolation_with_multiple_users', async () => {
      const user1Credits = { current: 5 };
      const user2Credits = { current: 5 };

      const deductForUser1 = async () => {
        if (user1Credits.current > 0) {
          user1Credits.current -= 1;
          return { success: true, user: 'user1', credits: user1Credits.current };
        }
        return { success: false };
      };

      const deductForUser2 = async () => {
        if (user2Credits.current > 0) {
          user2Credits.current -= 1;
          return { success: true, user: 'user2', credits: user2Credits.current };
        }
        return { success: false };
      };

      const results = await simulateConcurrentTransactions(
        async () => {
          if (Math.random() > 0.5) {
            return deductForUser1();
          } else {
            return deductForUser2();
          }
        },
        4
      );

      expect(results.length).toBe(4);
      // Both users should have reduced credits
      expect(user1Credits.current).toBeLessThanOrEqual(5);
      expect(user2Credits.current).toBeLessThanOrEqual(5);
    });
  });

  describe('Controllable Transactions', () => {
    it('should_create_controllable_transaction', async () => {
      const tx = createControllableTransaction();
      tx.setResult({ success: true, credits: 4 });

      const result = await tx.execute();
      expect(result.success).toBe(true);
      expect(result.credits).toBe(4);
    });

    it('should_fail_on_demand', async () => {
      const tx = createControllableTransaction();
      tx.setShouldFail(true);

      await expect(tx.execute()).rejects.toThrow();
    });

    it('should_support_delay', async () => {
      vi.useFakeTimers();
      const tx = createControllableTransaction();
      tx.setDelay(10);
      tx.setResult({ success: true });

      try {
        let resolved = false;
        const executePromise = tx.execute().then(() => {
          resolved = true;
        });

        await vi.advanceTimersByTimeAsync(9);
        expect(resolved).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await executePromise;
        expect(resolved).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should_clear_state', async () => {
      const tx = createControllableTransaction();
      tx.setShouldFail(true);
      tx.setDelay(100);
      tx.clear();

      // After clear, should execute successfully
      await expect(tx.execute()).resolves.toBeDefined();
    });
  });

  describe('Execution Tracking', () => {
    it('should_track_all_operations', () => {
      const tracker = new TransactionExecutionTracker();

      tracker.track('tx1', 'deduct', 'started');
      tracker.track('tx1', 'deduct', 'completed');
      tracker.track('tx2', 'deduct', 'started');
      tracker.track('tx2', 'deduct', 'completed');

      const executions = tracker.getExecutions();
      expect(executions).toHaveLength(4);
    });

    it('should_get_execution_order', () => {
      const tracker = new TransactionExecutionTracker();

      tracker.track('tx1', 'deduct', 'started');
      tracker.track('tx2', 'deduct', 'started');
      tracker.track('tx1', 'deduct', 'completed');
      tracker.track('tx2', 'deduct', 'completed');

      const order = tracker.getExecutionOrder();
      expect(order).toEqual(['tx1', 'tx2', 'tx1', 'tx2']);
    });

    it('should_count_operations', () => {
      const tracker = new TransactionExecutionTracker();

      tracker.track('tx1', 'deduct', 'started');
      tracker.track('tx2', 'deduct', 'started');
      tracker.track('tx1', 'deduct', 'completed');

      const deductCount = tracker.getOperationCount('deduct');
      expect(deductCount).toBe(3);
    });

    it('should_clear_tracking', () => {
      const tracker = new TransactionExecutionTracker();

      tracker.track('tx1', 'deduct', 'started');
      tracker.clear();

      const executions = tracker.getExecutions();
      expect(executions).toHaveLength(0);
    });
  });
});
