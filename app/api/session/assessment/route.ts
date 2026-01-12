import { NextRequest, NextResponse } from 'next/server';
import { setAssessmentData, setCompletionId } from '@/lib/session-storage';
import type { AssessmentData } from '@/schemas/session.schema';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimit';
import { requireSessionUser } from '@/lib/session-request';

// Force Node.js runtime - Netlify Edge doesn't forward POST bodies correctly
export const runtime = 'nodejs';

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
    const sessionUser = await requireSessionUser(
      request,
      'session/assessment',
      'session-assessment',
      rateLimiters.strict
    );
    if (sessionUser instanceof NextResponse) {
      return sessionUser;
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
