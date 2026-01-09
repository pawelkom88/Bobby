import { NextRequest, NextResponse } from 'next/server';
import { getAllSessionData } from '@/lib/session-storage';
import { verifyIdToken } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { extractAndValidateToken } from '@/lib/auth-utils';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';

/**
 * GET /api/session/get
 *
 * Retrieves all session data from secure server-side storage
 *
 * Security:
 * - Requires Firebase ID token authentication
 * - Data decrypted from httpOnly cookies
 *
 * Request:
 * - Headers: Authorization: Bearer <firebase_id_token>
 *
 * Response:
 * - 200: { lastAssessment?, completionId?, processedCompletionId?, conversationComplete? }
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const idToken = extractAndValidateToken(request, 'session/get');
    
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing authorization token' },
        { status: 401 }
      );
    }

    let decodedToken: { uid: string };
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `session-get:${userId}:${clientIp}`;
    const rateLimit = await rateLimiters.api.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimit),
        }
      );
    }

    // Get all session data
    const sessionData = await getAllSessionData();
    logger.log('[session/get] Session data retrieved successfully');

    return NextResponse.json({ success: true, data: sessionData });
  } catch (error) {
    logger.error('Error retrieving session data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve session data' },
      { status: 500 }
    );
  }
}
