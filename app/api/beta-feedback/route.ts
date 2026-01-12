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
import { logger } from '@/lib/logger';
import { rateLimiters, createRateLimitHeaders } from '@/lib/rateLimit';
import { BetaFeedbackSchema } from '@/lib/schemas/beta-feedback';
import { verifyBearerUser, enforceBearerRateLimit } from '@/lib/bearer-auth';

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
    const userResult = await verifyBearerUser(request, auth, 'beta-feedback');

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
    const rateLimitResponse = await enforceBearerRateLimit(
      request,
      userId,
      rateLimiters.api,
      'beta-feedback',
      rateLimit => {
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
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
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
  } catch (error: unknown) {
    const errorObject =
      typeof error === 'object' && error !== null ? error : {};
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : undefined;
    const stack = error instanceof Error ? error.stack : undefined;
    const code =
      'code' in errorObject ? (errorObject as { code?: unknown }).code : undefined;
    const details =
      'details' in errorObject
        ? (errorObject as { details?: unknown }).details
        : undefined;

    logger.error('Error in beta-feedback:', {
      message,
      stack,
      code,
      details,
      error,
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
