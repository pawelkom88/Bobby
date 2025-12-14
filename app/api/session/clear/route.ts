import { NextRequest, NextResponse } from 'next/server';
import { clearAllSessionValues } from '@/lib/session-storage';
import { verifyIdToken } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { extractAndValidateToken } from '@/lib/auth-utils';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';

/**
 * POST /api/session/clear
 *
 * Clears all session data from secure server-side storage
 *
 * Security:
 * - Requires Firebase ID token authentication
 * - Removes all encrypted session cookies
 *
 * Request:
 * - Headers: Authorization: Bearer <firebase_id_token>
 *
 * Response:
 * - 200: Success
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const idToken = extractAndValidateToken(request, 'session/clear');
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'Invalid or missing authorization token' },
        { status: 401 }
      );
    }

    let decodedToken: { uid: string };
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `session-clear:${userId}:${clientIp}`;
    const rateLimit = await rateLimiters.strict.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
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

    // Clear all session data
    await clearAllSessionValues();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error clearing session data:', error);
    return NextResponse.json(
      { error: 'Failed to clear session data' },
      { status: 500 }
    );
  }
}
