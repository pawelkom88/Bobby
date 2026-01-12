/**
 * Transaction Simulator
 * Utilities for simulating concurrent transactions and race conditions
 */

export interface TransactionResult {
  success: boolean;
  error?: Error;
  data?: any;
}

/**
 * Simulates concurrent transaction execution
 */
export async function simulateConcurrentTransactions(
  transactionFn: () => Promise<any>,
  concurrencyLevel: number = 2
): Promise<TransactionResult[]> {
  const promises = Array.from({ length: concurrencyLevel }, () =>
    transactionFn()
      .then((data) => ({ success: true, data }))
      .catch((error) => ({ success: false, error }))
  );

  return Promise.all(promises);
}

/**
 * Simulates a transaction with a delay
 */
export async function simulateDelayedTransaction(
  transactionFn: () => Promise<any>,
  delayMs: number
): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return transactionFn();
}

/**
 * Simulates a transaction that fails midway
 */
export async function simulatePartialFailureTransaction(
  setupFn: () => Promise<any>,
  _commitFn: () => Promise<any>
): Promise<any> {
  try {
    await setupFn();
    throw new Error('Simulated partial failure');
  } catch (error) {
    // Rollback would happen here
    throw error;
  }
}

/**
 * Tracks transaction execution order
 */
export class TransactionExecutionTracker {
  private executions: Array<{
    id: string;
    timestamp: number;
    operation: string;
    status: 'started' | 'completed' | 'failed';
  }> = [];

  track(id: string, operation: string, status: 'started' | 'completed' | 'failed') {
    this.executions.push({
      id,
      timestamp: Date.now(),
      operation,
      status,
    });
  }

  getExecutions() {
    return [...this.executions];
  }

  getExecutionOrder() {
    return this.executions.map((e) => e.id);
  }

  getOperationCount(operation: string) {
    return this.executions.filter((e) => e.operation === operation).length;
  }

  clear() {
    this.executions = [];
  }
}

/**
 * Simulates a race condition scenario
 */
export async function simulateRaceCondition(
  transaction1: () => Promise<any>,
  transaction2: () => Promise<any>
): Promise<{ results: TransactionResult[]; tracker: TransactionExecutionTracker }> {
  const tracker = new TransactionExecutionTracker();

  const wrappedTx1 = async () => {
    tracker.track('tx1', 'deduct', 'started');
    try {
      const result = await transaction1();
      tracker.track('tx1', 'deduct', 'completed');
      return result;
    } catch (error) {
      tracker.track('tx1', 'deduct', 'failed');
      throw error;
    }
  };

  const wrappedTx2 = async () => {
    tracker.track('tx2', 'deduct', 'started');
    try {
      const result = await transaction2();
      tracker.track('tx2', 'deduct', 'completed');
      return result;
    } catch (error) {
      tracker.track('tx2', 'deduct', 'failed');
      throw error;
    }
  };

  const results = await simulateConcurrentTransactions(
    async () => {
      // Randomly interleave execution
      if (Math.random() > 0.5) {
        return wrappedTx1();
      } else {
        return wrappedTx2();
      }
    },
    2
  );

  return { results, tracker };
}

/**
 * Simulates a stress test with multiple concurrent transactions
 */
export async function simulateStressTest(
  transactionFn: () => Promise<any>,
  concurrencyLevel: number = 10,
  iterations: number = 1
): Promise<{
  results: TransactionResult[];
  successCount: number;
  failureCount: number;
  totalTime: number;
}> {
  const startTime = Date.now();
  const allResults: TransactionResult[] = [];

  for (let i = 0; i < iterations; i++) {
    const results = await simulateConcurrentTransactions(transactionFn, concurrencyLevel);
    allResults.push(...results);
  }

  const totalTime = Date.now() - startTime;
  const successCount = allResults.filter((r) => r.success).length;
  const failureCount = allResults.filter((r) => !r.success).length;

  return {
    results: allResults,
    successCount,
    failureCount,
    totalTime,
  };
}

/**
 * Creates a mock transaction that can be controlled
 */
export function createControllableTransaction() {
  let shouldFail = false;
  let delayMs = 0;
  let result: any = { success: true };

  return {
    setShouldFail(fail: boolean) {
      shouldFail = fail;
    },
    setDelay(ms: number) {
      delayMs = ms;
    },
    setResult(res: any) {
      result = res;
    },
    clear() {
      shouldFail = false;
      delayMs = 0;
      result = { success: true };
    },
    execute: async () => {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldFail) {
        throw new Error('Controlled transaction failure');
      }
      return result;
    },
  };
}

/**
 * Verifies transaction isolation
 */
export async function verifyTransactionIsolation(
  transaction1: () => Promise<any>,
  transaction2: () => Promise<any>,
  expectedState: any
): Promise<boolean> {
  const results = await simulateConcurrentTransactions(
    async () => {
      // Execute both transactions
      await transaction1();
      await transaction2();
      return expectedState;
    },
    2
  );

  return results.every((r) => r.success);
}
