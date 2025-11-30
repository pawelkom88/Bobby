/**
 * Credit Transaction
 * Handles atomic credit deduction with idempotency protection
 */

export interface CreditDeductionResult {
  success: boolean;
  newCredits: number;
  charged: boolean;
  durationSeconds: number;
  error?: string;
}

export class CreditTransactionError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'CreditTransactionError';
  }
}

/**
 * Validates input parameters
 */
function validateInputs(
  userId: string,
  conversationId: string,
  durationSeconds: number,
  currentCredits: number
): void {
  if (!userId || typeof userId !== 'string') {
    throw new CreditTransactionError(
      'validation/invalid-user-id',
      'Invalid or missing user ID'
    );
  }

  if (!conversationId || typeof conversationId !== 'string') {
    throw new CreditTransactionError(
      'validation/invalid-conversation-id',
      'Invalid or missing conversation ID'
    );
  }

  if (typeof durationSeconds !== 'number' || durationSeconds < 0) {
    throw new CreditTransactionError(
      'validation/invalid-duration',
      'Invalid duration'
    );
  }

  if (typeof currentCredits !== 'number' || currentCredits < 0) {
    throw new CreditTransactionError(
      'validation/invalid-credits',
      'Invalid credit amount'
    );
  }
}

/**
 * Checks if user has sufficient credits
 */
function validateSufficientCredits(currentCredits: number): void {
  if (currentCredits <= 0) {
    throw new CreditTransactionError(
      'payment/insufficient-credits',
      'User has insufficient credits'
    );
  }
}

/**
 * Checks if conversation has already been charged (idempotency)
 */
function checkIdempotency(alreadyCharged: boolean): void {
  if (alreadyCharged) {
    throw new CreditTransactionError(
      'transaction/already-charged',
      'Conversation has already been charged'
    );
  }
}

/**
 * Deducts one credit from user account
 * This is an atomic operation that should be wrapped in a Firestore transaction
 *
 * @param userId - The user ID
 * @param conversationId - The conversation ID
 * @param durationSeconds - Duration of conversation in seconds
 * @param currentCredits - Current credit count
 * @param alreadyCharged - Whether conversation was already charged
 * @param deductCreditFn - Function to deduct credit (from Firestore transaction)
 * @param recordDeductionFn - Function to record deduction (from Firestore transaction)
 * @returns Result with new credit count
 * @throws CreditTransactionError if validation fails
 */
export async function deductCredit(
  userId: string,
  conversationId: string,
  durationSeconds: number,
  currentCredits: number,
  alreadyCharged: boolean,
  deductCreditFn: (userId: string, amount: number) => Promise<number>,
  recordDeductionFn: (
    conversationId: string,
    userId: string,
    durationSeconds: number,
    creditsDeducted: number
  ) => Promise<void>
): Promise<CreditDeductionResult> {
  // Validate inputs
  validateInputs(userId, conversationId, durationSeconds, currentCredits);

  // Check if already charged (idempotency)
  checkIdempotency(alreadyCharged);

  // Check sufficient credits
  validateSufficientCredits(currentCredits);

  try {
    // Deduct 1 credit
    const newCredits = await deductCreditFn(userId, 1);

    // Record the deduction for audit trail
    await recordDeductionFn(conversationId, userId, durationSeconds, 1);

    return {
      success: true,
      newCredits,
      charged: true,
      durationSeconds,
    };
  } catch (error: any) {
    // If it's already our custom error, re-throw it
    if (error instanceof CreditTransactionError) {
      throw error;
    }

    // Otherwise, wrap it
    throw new CreditTransactionError(
      'transaction/failed',
      `Credit deduction failed: ${error.message}`
    );
  }
}

/**
 * Simulates a transaction with rollback capability
 * Used for testing atomic operations
 */
export class TransactionSimulator {
  private operations: Array<{
    type: 'deduct' | 'record';
    data: any;
  }> = [];
  private shouldFail = false;
  private failAtStep: number | null = null;

  /**
   * Configure transaction to fail at specific step
   */
  setShouldFail(fail: boolean, atStep?: number): void {
    this.shouldFail = fail;
    this.failAtStep = atStep ?? null;
  }

  /**
   * Add operation to transaction
   */
  addOperation(type: 'deduct' | 'record', data: any): void {
    this.operations.push({ type, data });
  }

  /**
   * Get all operations
   */
  getOperations() {
    return [...this.operations];
  }

  /**
   * Execute transaction
   */
  async execute(): Promise<any> {
    if (this.shouldFail && (this.failAtStep === null || this.failAtStep === 0)) {
      throw new Error('Transaction failed');
    }

    let stepCount = 0;
    for (const op of this.operations) {
      if (this.shouldFail && this.failAtStep === stepCount) {
        throw new Error(`Transaction failed at step ${stepCount}`);
      }
      stepCount++;
    }

    return { success: true, operations: this.operations };
  }

  /**
   * Rollback transaction (clear operations)
   */
  rollback(): void {
    this.operations = [];
  }

  /**
   * Clear transaction state
   */
  clear(): void {
    this.operations = [];
    this.shouldFail = false;
    this.failAtStep = null;
  }
}

/**
 * Validates transaction consistency
 */
export function validateTransactionConsistency(
  initialCredits: number,
  finalCredits: number,
  deductionCount: number
): boolean {
  const expectedCredits = initialCredits - deductionCount;
  return finalCredits === expectedCredits;
}

/**
 * Calculates expected credits after deduction
 */
export function calculateExpectedCredits(
  currentCredits: number,
  shouldCharge: boolean
): number {
  if (shouldCharge) {
    return currentCredits - 1;
  }
  return currentCredits;
}
