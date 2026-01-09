import { NextRequest, NextResponse } from 'next/server';
import { setConversationId } from '@/lib/session-storage';
import { verifyIdToken } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { extractAndValidateToken } from '@/lib/auth-utils';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';

// Force Node.js runtime - Netlify Edge doesn't forward POST bodies correctly
export const runtime = 'nodejs';

/**
 * POST /api/session/conversation-id
 *
 * Stores conversation ID in secure server-side session
 *
 * Security:
 * - Requires Firebase ID token authentication
 * - Data encrypted with AES-256-GCM
 * - Stored in httpOnly cookies
 *
 * Request:
 * - Headers: Authorization: Bearer <firebase_id_token>
 * - Body: { conversationId: string }
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
    const idToken = extractAndValidateToken(request, 'session/conversation-id');
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'Invalid or missing authorization token' },
        { status: 401 }
      );
    }

    try {
      const decodedToken = await verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Rate limiting: Use userId + IP for better protection
      const clientIp = getClientIP(request);
      const rateLimitIdentifier = `${userId}:${clientIp}`;

      // Use strict rate limiter (10 requests per minute) since this affects session state
      const rateLimit = await rateLimiters.strict.isRateLimited(rateLimitIdentifier);

      if (rateLimit.limited) {
        logger.warn('Rate limit exceeded for session conversation-id endpoint', {
          userId,
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        });

        return NextResponse.json(
          { error: 'Too many requests', retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
          {
            status: 429,
            headers: createRateLimitHeaders(rateLimit),
          }
        );
      }

      // Parse request body
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      const { conversationId } = body;

      if (!conversationId || typeof conversationId !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid conversationId' },
          { status: 400 }
        );
      }

      // Store conversation ID
      await setConversationId(conversationId);

      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Error storing conversation ID:', error);
    return NextResponse.json(
      { error: 'Failed to store conversation ID' },
      { status: 500 }
    );
  }
}
