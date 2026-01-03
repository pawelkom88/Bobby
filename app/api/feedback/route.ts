/**
 * POST /api/feedback
 * Stores NPS feedback from beta users
 *
 * Security:
 * - Requires valid Firebase ID token
 * - Only allows beta users to submit feedback
 * - Rate limited to prevent spam
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
import { z } from 'zod';

// Request validation schema for comprehensive beta feedback
const betaFeedbackSchema = z.object({
  conversationId: z.string().optional(),
  childAge: z.string().min(1),
  scenarios: z.array(z.string()),
  easeOfUnderstanding: z.number().int().min(1).max(5),
  childFeelings: z.string().min(1),
  uncomfortable: z.string().optional(),
  safetyRating: z.number().int().min(1).max(5),
  practiceClarity: z.string().min(1),
  usefulness: z.string().min(1),
  wouldUseAgain: z.string().min(1),
  npsScore: z.number().int().min(0).max(10),
  likedMost: z.string().optional(),
  improveFirst: z.string().optional(),
  contactOptIn: z.boolean(),
  contactEmail: z.string().email().optional(),
});

interface FeedbackRequest {
  conversationId?: string;
  childAge: string;
  scenarios: string[];
  easeOfUnderstanding: number;
  childFeelings: string;
  uncomfortable?: string;
  safetyRating: number;
  practiceClarity: string;
  usefulness: string;
  wouldUseAgain: string;
  npsScore: number;
  likedMost?: string;
  improveFirst?: string;
  contactOptIn: boolean;
  contactEmail?: string;
}

interface FeedbackResponse {
  success: boolean;
  error?: string;
  message?: string;
  retryAfter?: number;
}

/**
 * Extracts and verifies user from token
 */
async function verifyUserFromToken(
  request: NextRequest,
  auth: ReturnType<typeof getAdminAuth>,
  db: ReturnType<typeof getAdminDb>
): Promise<{ userId: string; isBeta: boolean } | { error: string; status: number }> {
  const tokenResult = extractBearerToken(request);
  
  if (!tokenResult.success) {
    logger.warn('Token extraction failed', {
      error: tokenResult.error,
      endpoint: 'feedback'
    });
    return { error: tokenResult.message, status: 401 };
  }

  try {
    const result = await verifyToken(token => auth.verifyIdToken(token), tokenResult.token);

    if (!result.success || !result.uid) {
      logger.warn('Token verification failed');
      return { error: 'Invalid token', status: 401 };
    }

    // Check if user is beta user
    const userDoc = await db.collection('users').doc(result.uid).get();
    if (!userDoc.exists) {
      return { error: 'User not found', status: 404 };
    }
    
    const userData = userDoc.data();
    const isBeta = userData?.betaUser === true && process.env.BETA_MODE_ENABLED === 'true';
    
    if (!isBeta) {
      return { error: 'Only beta users can submit feedback', status: 403 };
    }

    return { userId: result.uid, isBeta };
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
): Promise<NextResponse<FeedbackResponse>> {
  try {
    // Lazy initialization - only initialize when handler is called
    const auth = getAdminAuth();
    const db = getAdminDb();

    // 1. Parse and validate request
    const body = await request.json();
    const validation = betaFeedbackSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid beta feedback request:', validation.error.issues);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid feedback data',
        } satisfies FeedbackResponse,
        { status: 400 }
      );
    }

    const {
      conversationId,
      childAge,
      scenarios,
      easeOfUnderstanding,
      childFeelings,
      uncomfortable,
      safetyRating,
      practiceClarity,
      usefulness,
      wouldUseAgain,
      npsScore,
      likedMost,
      improveFirst,
      contactOptIn,
      contactEmail,
    } = validation.data!;

    // 2. Verify user from token
    const userResult = await verifyUserFromToken(request, auth, db);

    if ('error' in userResult) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: userResult.error },
        { status: userResult.status }
      );
    }

    const { userId } = userResult;

    // 3. Rate limiting
    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `feedback:${userId}:${clientIp}`;
    const rateLimit = await rateLimiters.api.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
      logger.warn('Rate limit exceeded for feedback endpoint', {
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

    logger.log(`User ${userId} submitting comprehensive beta feedback`);

    // 4. Store comprehensive feedback
    const feedbackData = {
      userId,
      conversationId,
      // Section 1: About the child
      childAge,
      scenarios,
      // Section 2: Experience
      easeOfUnderstanding,
      childFeelings,
      uncomfortable: uncomfortable || null,
      // Section 3: Safety & Trust
      safetyRating,
      practiceClarity,
      // Section 4: Value
      usefulness,
      wouldUseAgain,
      // Section 5: NPS and Open feedback
      npsScore,
      likedMost: likedMost || null,
      improveFirst: improveFirst || null,
      contactOptIn,
      contactEmail: contactEmail || null,
      // Metadata
      submittedAt: new Date().toISOString(),
      betaUser: true,
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    await db.collection('feedback').add(feedbackData);

    logger.log(`Successfully stored comprehensive beta feedback from user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback submitted successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error storing feedback:', error);

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
