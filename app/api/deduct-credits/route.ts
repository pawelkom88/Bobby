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
import { verifyToken } from '@/lib/token-verifier';
import {
  validateOwnership,
  OwnershipValidationError,
} from '@/lib/ownership-validator';
import { CreditTransactionError } from '@/lib/credit-transaction';
import { calculateDuration } from '@/lib/duration-calculator';
import { isEligibleForCharge } from '@/lib/charge-eligibility';
import { logger } from '@/lib/logger';
import { extractBearerToken } from '@/lib/auth-utils';

// Initialize Firebase Admin lazily (runtime only)
const auth = getAdminAuth();
const db = getAdminDb();

interface DeductCreditsRequest {
  conversationId: string;
}

interface DeductCreditsResponse {
  success: boolean;
  newCredits?: number;
  charged?: boolean;
  durationSeconds?: number;
  error?: string;
  message?: string;
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
 * Extracts and verifies user from token
 */
async function verifyUserFromToken(
  request: NextRequest
): Promise<{ userId: string } | { error: string; status: number }> {
  const tokenResult = extractBearerToken(request);
  
  if (!tokenResult.success) {
    logger.warn('Token extraction failed', {
      error: tokenResult.error,
      endpoint: 'deduct-credits'
    });
    return { error: tokenResult.message, status: 401 };
  }

  try {
    const result = await verifyToken(token => auth.verifyIdToken(token), tokenResult.token);

    if (!result.success || !result.uid) {
      logger.warn('Token verification failed');
      return { error: 'Invalid token', status: 401 };
    }

    return { userId: result.uid };
  } catch (error: any) {
    logger.warn('Token verification error:', error.code);

    if (error.code === 'auth/id-token-expired') {
      return { error: 'Token has expired', status: 401 };
    }
    if (error.code === 'auth/id-token-revoked') {
      return { error: 'Token has been revoked', status: 401 };
    }

    return { error: 'Invalid token', status: 401 };
  }
}

/**
 * Fetches conversation from Firestore
 */
async function getConversation(
  conversationId: string
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
async function isAlreadyCharged(conversationId: string): Promise<boolean> {
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
 * Gets current user credits
 */
async function getUserCredits(userId: string): Promise<number> {
  try {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) {
      logger.warn(`User ${userId} not found`);
      return 0;
    }
    return doc.data()?.credits ?? 0;
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
  durationSeconds: number
): Promise<number> {
  return await db.runTransaction(async transaction => {
    // 1. Get current user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const currentCredits = userDoc.data()?.credits ?? 0;

    // 2. Verify sufficient credits
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
    });

    // 5. Mark conversation as charged
    const conversationRef = db.collection('conversations').doc(conversationId);
    transaction.update(conversationRef, { charged: true });

    return newCredits;
  });
}

/**
 * Main handler
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<DeductCreditsResponse>> {
  try {
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
    const userResult = await verifyUserFromToken(request);

    if ('error' in userResult) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: userResult.error },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;
    logger.log(
      `User ${userId} requesting credit deduction for conversation ${conversationId}`
    );

    // 3. Verify user owns conversation
    try {
      await validateOwnership(userId, conversationId, getConversation);
    } catch (error: any) {
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

    // 4. Check if already charged (idempotency)
    const alreadyCharged = await isAlreadyCharged(conversationId);
    if (alreadyCharged) {
      logger.log(
        `Conversation ${conversationId} already charged (idempotency)`
      );
      const currentCredits = await getUserCredits(userId);
      return NextResponse.json(
        {
          success: false,
          error: 'already-charged',
          message: 'Conversation already charged',
          newCredits: currentCredits,
        },
        { status: 200 }
      );
    }

    // 5. Get conversation to calculate duration
    const conversation = await getConversation(conversationId);
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

    // 6. Calculate duration server-side (security: client cannot manipulate)
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

    // 7. Check charge eligibility
    const eligibility = isEligibleForCharge(
      durationSeconds,
      conversation.charged
    );

    if (!eligibility.isEligible) {
      logger.log(
        `Conversation ${conversationId} not eligible for charge: ${eligibility.reason}`
      );
      const currentCredits = await getUserCredits(userId);
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          message: `Not eligible for charge: ${eligibility.reason}`,
          newCredits: currentCredits,
        },
        { status: 200 }
      );
    }

    // 8. Perform atomic deduction
    const newCredits = await performDeduction(
      userId,
      conversationId,
      durationSeconds
    );

    logger.log(
      `Successfully deducted 1 credit from user ${userId}. New balance: ${newCredits}`
    );

    return NextResponse.json(
      {
        success: true,
        newCredits,
        charged: true,
        durationSeconds,
      },
      { status: 200 }
    );
  } catch (error: any) {
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
