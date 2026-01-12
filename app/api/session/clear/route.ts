import { NextRequest, NextResponse } from 'next/server';
import { clearAllSessionValues } from '@/lib/session-storage';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimit';
import { requireSessionUser } from '@/lib/session-request';

// Force Node.js runtime - Netlify Edge doesn't forward POST bodies correctly
export const runtime = 'nodejs';

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
    const sessionUser = await requireSessionUser(
      request,
      'session/clear',
      'session-clear',
      rateLimiters.strict
    );
    if (sessionUser instanceof NextResponse) {
      return sessionUser;
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
