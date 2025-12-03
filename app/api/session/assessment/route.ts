import { NextRequest, NextResponse } from 'next/server';
import { setAssessmentData, setCompletionId } from '@/lib/session-storage';
import { verifyIdToken } from '@/lib/firebase-admin';
import type { AssessmentData } from '@/lib/session-storage';
import { logger } from '@/lib/logger';
import { extractAndValidateToken } from '@/lib/auth-utils';

/**
 * POST /api/session/assessment
 *
 * Stores assessment data in secure server-side session
 *
 * Security:
 * - Requires Firebase ID token authentication
 * - Data encrypted with AES-256-GCM
 * - Stored in httpOnly cookies
 *
 * Request:
 * - Headers: Authorization: Bearer <firebase_id_token>
 * - Body: { assessment: AssessmentData, completionId: string }
 *
 * Response:
 * - 200: Success
 * - 401: Unauthorized
 * - 400: Bad request
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const idToken = extractAndValidateToken(request, 'session/assessment');
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'Invalid or missing authorization token' },
        { status: 401 }
      );
    }

    try {
      await verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { assessment, completionId } = body;

    if (!assessment || !completionId) {
      return NextResponse.json(
        { error: 'Missing assessment or completionId' },
        { status: 400 }
      );
    }

    // Store assessment data
    await setAssessmentData(assessment as AssessmentData);
    await setCompletionId(completionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error storing assessment:', error);
    return NextResponse.json(
      { error: 'Failed to store assessment' },
      { status: 500 }
    );
  }
}
