import { NextRequest, NextResponse } from 'next/server';
import { setConversationComplete } from '@/lib/session-storage';
import { verifyIdToken } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';
import { extractAndValidateToken } from '@/lib/auth-utils';

/**
 * POST /api/session/complete
 *
 * Marks conversation as complete in secure server-side session
 * This must be called BEFORE credit deduction to ensure users can
 * access completion page even with 0 credits
 *
 * Security:
 * - Requires Firebase ID token authentication
 * - Sets 24-hour expiration for completion access
 *
 * Request:
 * - Headers: Authorization: Bearer <firebase_id_token>
 * - Body: { complete: boolean }
 *
 * Response:
 * - 200: { success: true }
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  logger.log('[session/complete] Request received');
  try {
    // 1. Extract and validate Bearer token
    const idToken = extractAndValidateToken(request, 'session/complete');

    if (!idToken) {
      logger.error('[session/complete] No token provided');
      return NextResponse.json(
        { error: 'Invalid or missing authorization token' },
        { status: 401 }
      );
    }
    logger.log('[session/complete] Token extracted');

    // 2. Verify token with Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      const clientIp = getClientIP(request);
      logger.warn('Authentication failure for session complete endpoint', {
        action: 'session_complete_auth_failure',
        ip: clientIp,
        userAgent: request.headers.get('user-agent'),
        reason: error instanceof Error ? error.message : 'Unknown',
        // Don't log the token itself - security risk
      });
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // 3. Rate limiting: Use userId + IP for better protection
    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `${userId}:${clientIp}`;

    // Use API rate limiter (100 requests per 15 minutes)
    const rateLimit = await rateLimiters.api.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
      logger.warn('Rate limit exceeded for session complete endpoint', {
        userId,
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      });

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

    // 4. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { complete } = body;

    if (typeof complete !== 'boolean') {
      logger.error('[session/complete] Invalid complete value:', typeof complete);
      return NextResponse.json(
        { error: 'complete must be a boolean' },
        { status: 400 }
      );
    }

    // 5. Mark conversation as complete with 24-hour expiration
    logger.log('[session/complete] Calling setConversationComplete...');
    try {
      await setConversationComplete(userId, complete);
      logger.log(`[session/complete] Success - marked as ${complete ? 'complete' : 'incomplete'} for user ${userId}`);
    } catch (storageError) {
      logger.error('[session/complete] setConversationComplete failed:', storageError);
      throw storageError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error setting conversation complete:', error);
    return NextResponse.json(
      { error: 'Failed to set conversation status' },
      { status: 500 }
    );
  }
}
