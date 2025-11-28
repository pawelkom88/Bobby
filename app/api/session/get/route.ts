import { NextRequest, NextResponse } from 'next/server';
import { getAllSessionData } from '@/lib/session-storage';
import { verifyIdToken } from '@/lib/firebase-admin';

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    // Get all session data
    const sessionData = await getAllSessionData();

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error('Error retrieving session data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session data' },
      { status: 500 }
    );
  }
}
