import { createClient } from '@deepgram/sdk';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';
import { verifyIdToken, getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/authenticate
 *
 * Generates a temporary Deepgram API token for voice conversations.
 *
 * Security (CRITICAL FIX - CWE-306):
 * - Now requires Firebase ID token authentication
 * - Verifies user has credits before issuing token
 * - Rate limited per user + IP combination
 * - Tokens are short-lived and scoped
 *
 * Headers:
 * - Authorization: Bearer <firebase_id_token>
 *
 * Response:
 * - 200: { token: string, ... } - Deepgram token
 * - 401: Missing or invalid authentication
 * - 403: Insufficient credits
 * - 429: Rate limited
 * - 500: Server error
 */
export async function GET(request: Request) {
  try {
    // 1. Extract and verify Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(
        'Missing or invalid Authorization header for authenticate endpoint'
      );
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing token in Authorization header' },
        { status: 401 }
      );
    }

    // 2. Verify token with Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      logger.warn('Token verification failed for authenticate endpoint');
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // 3. Rate limiting: Use userId + IP for better protection
    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `${userId}:${clientIp}`;

    // ✅ NEW: Using pre-configured API rate limiter
    const rateLimit = await rateLimiters.api.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
      logger.warn('Rate limit exceeded for authenticate endpoint', {
        userId,
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      });

      // ✅ NEW: Using helper for headers
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimit),
        }
      );
    }

    // 4. Verify user has credits
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const credits = userData?.credits || 0;

    if (credits <= 0) {
      logger.info('User attempted to get token without credits', { userId });
      return NextResponse.json(
        {
          error:
            'Insufficient credits. Please purchase more credits to continue.',
        },
        { status: 403 }
      );
    }

    // 5. Generate Deepgram token
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY ?? '');

    const { result: tokenResult, error: tokenError } =
      await deepgram.auth.grantToken();

    if (tokenError) {
      logger.error('Error creating Deepgram token');
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: 500 }
      );
    }

    if (!tokenResult) {
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: 500 }
      );
    }

    logger.info('Deepgram token generated successfully', { userId });
    return NextResponse.json({ ...tokenResult });
  } catch (error) {
    logger.error('Unexpected error in authenticate endpoint');
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
