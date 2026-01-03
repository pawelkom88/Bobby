/**
 * POST /api/beta-feedback
 * Submits beta feedback from authenticated users
 *
 * Security:
 * - Requires valid Firebase ID token
 * - Rate limited to prevent spam
 * - Input validation with Zod schema
 * - Proper error handling and logging
 * - CSRF protection (exempt for authenticated requests with Bearer tokens)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/token-verifier';
import { logger } from '@/lib/logger';
import { extractBearerToken } from '@/lib/auth-utils';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';
import { BetaFeedbackSchema } from '@/lib/schemas/beta-feedback';

interface SubmitFeedbackResponse {
  success: boolean;
  feedbackId?: string;
  error?: string;
  message?: string;
  retryAfter?: number;
}

/**
 * Validates request body using Zod schema
 */
function validateRequest(body: any): {
  valid: boolean;
  error?: string;
  data?: any;
} {
  const result = BetaFeedbackSchema.safeParse(body);

  if (!result.success) {
    const error = result.error.issues[0];
    return {
      valid: false,
      error: `${error.path.join('.')}: ${error.message}`,
    };
  }

  return { valid: true, data: result.data };
}

/**
 * Extracts and verifies user from token
 */
async function verifyUserFromToken(
  request: NextRequest,
  auth: ReturnType<typeof getAdminAuth>
): Promise<{ userId: string } | { error: string; status: number }> {
  const tokenResult = extractBearerToken(request);

  if (!tokenResult.success) {
    logger.warn('Token extraction failed', {
      error: tokenResult.error,
      endpoint: 'beta-feedback',
    });
    return { error: tokenResult.message, status: 401 };
  }

  try {
    const result = await verifyToken(
      token => auth.verifyIdToken(token),
      tokenResult.token
    );

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
 * Main handler
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SubmitFeedbackResponse>> {
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

    const validatedData = validation.data!;

    // 2. Verify user from token
    const userResult = await verifyUserFromToken(request, auth);

    if ('error' in userResult) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: userResult.error },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;

    // 3. CSRF validation (exempt for authenticated requests with Bearer tokens)
    // Since this endpoint requires a valid Firebase ID token, we can exempt it from CSRF
    // This follows the same pattern as other authenticated endpoints

    // 4. Rate limiting
    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `beta-feedback:${userId}:${clientIp}`;
    const rateLimit = await rateLimiters.api.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
      logger.warn('Rate limit exceeded for beta-feedback endpoint', {
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

    logger.log(`User ${userId} submitting beta feedback`);

    // 5. Verify conversation ownership if conversationId is provided
    if (validatedData.conversationId) {
      try {
        const conversationDoc = await db
          .collection('conversations')
          .doc(validatedData.conversationId)
          .get();

        if (!conversationDoc.exists) {
          return NextResponse.json(
            {
              success: false,
              error: 'conversation-not-found',
              message: 'Conversation not found',
            },
            { status: 404 }
          );
        }

        const conversationData = conversationDoc.data();
        if (conversationData?.userId !== userId) {
          logger.warn(
            `User ${userId} not authorized for conversation ${validatedData.conversationId}`
          );
          return NextResponse.json(
            {
              success: false,
              error: 'not-authorized',
              message: 'Not authorized for this conversation',
            },
            { status: 403 }
          );
        }
      } catch (error) {
        logger.error('Error verifying conversation ownership:', error);
        // Continue without conversation validation if there's an error
      }
    }

    // 6. Prepare the feedback document
    const feedbackDoc = {
      userId,
      ...validatedData,
      submittedAt: new Date().toISOString(),
    };

    // 7. Save to Firestore
    const feedbackRef = await db.collection('betaFeedback').add(feedbackDoc);

    logger.log(
      `Successfully submitted beta feedback from user ${userId}, feedbackId: ${feedbackRef.id}`
    );

    return NextResponse.json(
      {
        success: true,
        feedbackId: feedbackRef.id,
      },
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    logger.error('Error in beta-feedback:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      details: error?.details,
      error: error,
    });

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
