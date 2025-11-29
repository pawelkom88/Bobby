import { NextRequest, NextResponse } from 'next/server';
import { clearAllSessionValues } from '@/lib/session-storage';
import { verifyIdToken } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      await verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
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
