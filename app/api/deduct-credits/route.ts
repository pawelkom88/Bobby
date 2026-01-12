/**
 * POST /api/deduct-credits
 * Deducts one credit from user's account for a completed conversation
 *
 * Security:
 * - Requires valid Firebase ID token
 * - Verifies user owns the conversation
 * - Prevents double-charging (idempotency)
 * - Uses atomic Firestore transactions
 * - Server-side duration calculation
 * - Rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  validateOwnership,
  OwnershipValidationError,
} from '@/lib/ownership-validator';
import { CreditTransactionError } from '@/lib/credit-transaction';
import { calculateDuration } from '@/lib/duration-calculator';
import { isEligibleForCharge } from '@/lib/charge-eligibility';
import { logger } from '@/lib/logger';
import {
  rateLimiters,
  createRateLimitHeaders,
} from '@/lib/rateLimit';
import { verifyBearerUser, enforceBearerRateLimit } from '@/lib/bearer-auth';

interface DeductCreditsRequest {
  conversationId: string;
}

interface DeductCreditsResponse {
  success: boolean;
  newCredits?: number;
  newBetaCredits?: number;
  charged?: boolean;
  durationSeconds?: number;
  error?: string;
  message?: string;
  retryAfter?: number;
  isBetaUser?: boolean;
}

/**
 * Conversation data structure from Firestore
 */
interface ConversationData {
  id: string;
  userId: string;
  ageTier: 1 | 2 | 3;
  service: 'fire' | 'ambulance' | 'police';
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'completed' | 'abandoned';
  charged: boolean;
}

/**
 * Validates request body
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  if (!body.conversationId || typeof body.conversationId !== 'string') {
    return {
      valid: false,
      error: 'conversationId is required and must be a string',
    };
  }

  return { valid: true };
}

/**
 * Fetches conversation from Firestore
 */
async function getConversation(
  conversationId: string,
  db: ReturnType<typeof getAdminDb>
): Promise<ConversationData | null> {
  try {
    const doc = await db.collection('conversations').doc(conversationId).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data();
    if (!data) {
      return null;
    }
    return {
      id: doc.id,
      userId: data.userId,
      ageTier: data.ageTier,
      service: data.service,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      status: data.status,
      charged: data.charged,
    };
  } catch (error) {
    logger.error('Error fetching conversation:', error);
    throw error;
  }
}

/**
 * Checks if conversation has already been charged
 */
async function isAlreadyCharged(conversationId: string, db: ReturnType<typeof getAdminDb>): Promise<boolean> {
  try {
    const doc = await db
      .collection('creditDeductions')
      .doc(conversationId)
      .get();
    return doc.exists;
  } catch (error) {
    logger.error('Error checking deduction status:', error);
    throw error;
  }
}

/**
 * Gets current user credits and beta status
 */
async function getUserCredits(userId: string, db: ReturnType<typeof getAdminDb>): Promise<{ credits: number; isBeta: boolean; betaCredits: number }> {
  try {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) {
      logger.warn(`User ${userId} not found`);
      return { credits: 0, isBeta: false, betaCredits: 0 };
    }
    const data = doc.data();
    return {
      credits: data?.credits ?? 0,
      isBeta: data?.betaUser === true,
      betaCredits: data?.betaCredits ?? 0,
    };
  } catch (error) {
    logger.error('Error fetching user credits:', error);
    throw error;
  }
}

/**
 * Performs atomic credit deduction
 */
async function performDeduction(
  userId: string,
  conversationId: string,
  durationSeconds: number,
  db: ReturnType<typeof getAdminDb>
): Promise<{ newCredits: number; newBetaCredits: number; isBeta: boolean }> {
  return await db.runTransaction(async transaction => {
    // 1. Get current user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const data = userDoc.data();
    const currentCredits = data?.credits ?? 0;
    const currentBetaCredits = data?.betaCredits ?? 0;
    const isBeta = data?.betaUser === true;

    // 2. Verify sufficient credits (check beta first)
    if (isBeta) {
      if (currentBetaCredits <= 0) {
        throw new CreditTransactionError(
          'payment/insufficient-credits',
          'User has insufficient beta credits'
        );
      }
      // Deduct from beta credits
      const newBetaCredits = currentBetaCredits - 1;
      transaction.update(userRef, { betaCredits: newBetaCredits });
      
      // Record deduction for audit trail
      const deductionRef = db.collection('creditDeductions').doc(conversationId);
      transaction.set(deductionRef, {
        conversationId,
        userId,
        durationSeconds,
        creditsDeducted: 1,
        deductedAt: new Date().toISOString(),
        isBetaDeduction: true,
      });

      // Mark conversation as charged
      const conversationRef = db.collection('conversations').doc(conversationId);
      transaction.update(conversationRef, { charged: true });

      return { newCredits: currentCredits, newBetaCredits, isBeta: true };
    } else {
      // Regular credit deduction
      if (currentCredits <= 0) {
        throw new CreditTransactionError(
          'payment/insufficient-credits',
          'User has insufficient credits'
        );
      }

      // 3. Deduct credit
      const newCredits = currentCredits - 1;
      transaction.update(userRef, { credits: newCredits });

      // 4. Record deduction for audit trail
      const deductionRef = db.collection('creditDeductions').doc(conversationId);
      transaction.set(deductionRef, {
        conversationId,
        userId,
        durationSeconds,
        creditsDeducted: 1,
        deductedAt: new Date().toISOString(),
        isBetaDeduction: false,
      });

      // 5. Mark conversation as charged
      const conversationRef = db.collection('conversations').doc(conversationId);
      transaction.update(conversationRef, { charged: true });

      return { newCredits, newBetaCredits: currentBetaCredits, isBeta: false };
    }
  });
}

/**
 * Main handler
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<DeductCreditsResponse>> {
  try {
    // Lazy initialization - only initialize when handler is called
    const auth = getAdminAuth();
    const db = getAdminDb();

    // 1. Parse and validate request
    const body = await request.json();
    const validation = validateRequest(body);

    if (!validation.valid) {
      logger.warn('Invalid request:', validation.error);
      return NextResponse.json(
        { success: false, error: 'invalid-request', message: validation.error },
        { status: 400 }
      );
    }

    const { conversationId } = body as DeductCreditsRequest;

    // 2. Verify user from token
    const userResult = await verifyBearerUser(
      request,
      auth,
      'deduct-credits'
    );

    if ('error' in userResult) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: userResult.error },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;

    // 3. Rate limiting
    const rateLimitResponse = await enforceBearerRateLimit(
      request,
      userId,
      rateLimiters.strict,
      'deduct-credits',
      (rateLimit) => {
        logger.warn('Rate limit exceeded for deduct-credits endpoint', {
          userId,
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        });

        return NextResponse.json(
          {
            success: false,
            error: 'rate-limited',
            message: 'Too many requests',
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: createRateLimitHeaders(rateLimit),
          }
        );
      }
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    logger.log(
      `User ${userId} requesting credit deduction for conversation ${conversationId}`
    );

    // 4. Verify user owns conversation
    try {
      await validateOwnership(userId, conversationId, (id) => getConversation(id, db));
    } catch (error: unknown) {
      if (error instanceof OwnershipValidationError) {
        if (error.code === 'conversation/not-found') {
          logger.warn(`Conversation ${conversationId} not found`);
          return NextResponse.json(
            {
              success: false,
              error: 'conversation-not-found',
              message: 'Conversation not found',
            },
            { status: 404 }
          );
        }
        if (error.code === 'auth/not-authorized') {
          logger.warn(
            `User ${userId} not authorized for conversation ${conversationId}`
          );
          return NextResponse.json(
            {
              success: false,
              error: 'not-authorized',
              message: 'Not authorized',
            },
            { status: 403 }
          );
        }
      }
      throw error;
    }

    // 5. Check if already charged (idempotency)
    const alreadyCharged = await isAlreadyCharged(conversationId, db);
    if (alreadyCharged) {
      logger.log(
        `Conversation ${conversationId} already charged (idempotency)`
      );
      const creditInfo = await getUserCredits(userId, db);
      return NextResponse.json(
        {
          success: false,
          error: 'already-charged',
          message: 'Conversation already charged',
          newCredits: creditInfo.credits,
          newBetaCredits: creditInfo.betaCredits,
          isBetaUser: creditInfo.isBeta,
        },
        { status: 200 }
      );
    }

    // 6. Get conversation to calculate duration
    const conversation = await getConversation(conversationId, db);
    if (!conversation) {
      logger.warn(`Conversation ${conversationId} not found`);
      return NextResponse.json(
        {
          success: false,
          error: 'conversation-not-found',
          message: 'Conversation not found',
        },
        { status: 404 }
      );
    }

    // 7. Calculate duration server-side (security: client cannot manipulate)
    if (!conversation.startedAt || !conversation.endedAt) {
      logger.warn(`Conversation ${conversationId} missing timestamps`);
      return NextResponse.json(
        {
          success: false,
          error: 'invalid-conversation',
          message: 'Conversation missing timestamps',
        },
        { status: 400 }
      );
    }

    const startTime = new Date(conversation.startedAt);
    const endTime = new Date(conversation.endedAt);
    const durationSeconds = calculateDuration(startTime, endTime);

    logger.log(`Conversation ${conversationId} duration: ${durationSeconds}s`);

    // 8. Check charge eligibility
    const eligibility = isEligibleForCharge(
      durationSeconds,
      conversation.charged
    );

    if (!eligibility.isEligible) {
      logger.log(
        `Conversation ${conversationId} not eligible for charge: ${eligibility.reason}`
      );
      const creditInfo = await getUserCredits(userId, db);
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          message: `Not eligible for charge: ${eligibility.reason}`,
          newCredits: creditInfo.credits,
          newBetaCredits: creditInfo.betaCredits,
          isBetaUser: creditInfo.isBeta,
        },
        { status: 200 }
      );
    }

    // 9. Perform atomic deduction
    const result = await performDeduction(
      userId,
      conversationId,
      durationSeconds,
      db
    );

    logger.log(
      `Successfully deducted 1 credit from user ${userId}. New balance: ${result.newCredits}, Beta: ${result.newBetaCredits}`
    );

    return NextResponse.json(
      {
        success: true,
        newCredits: result.newCredits,
        newBetaCredits: result.newBetaCredits,
        charged: true,
        durationSeconds,
        isBetaUser: result.isBeta,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Error in deduct-credits:', error);

    // Handle specific error types
    if (error instanceof CreditTransactionError) {
      if (error.code === 'payment/insufficient-credits') {
        return NextResponse.json(
          {
            success: false,
            error: 'insufficient-credits',
            message: error.message,
          },
          { status: 402 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: 'internal-error',
        message: 'An internal error occurred',
      },
      { status: 500 }
    );
  }
}
