/**
 * POST /api/conversation/start
 * Creates a conversation record with server-side timestamp
 *
 * Security:
 * - Requires valid Firebase ID token
 * - Server-side timestamp (client cannot manipulate)
 * - Creates conversation record for tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';
import { verifyBearerUser } from '@/lib/bearer-auth';

// Force Node.js runtime for proper body handling
export const runtime = 'nodejs';

interface StartConversationRequest {
  ageTier: 1 | 2 | 3;
  service: 'fire' | 'ambulance' | 'police';
}

interface StartConversationResponse {
  conversationId: string;
  startedAt: string;
  status: string;
  error?: string;
  message?: string;
  retryAfter?: number;
}

/**
 * Validates request body
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  const validAgeTiers = [1, 2, 3];
  if (!validAgeTiers.includes(body.ageTier)) {
    return { valid: false, error: 'Invalid ageTier' };
  }

  const validServices = ['fire', 'ambulance', 'police'];
  if (!validServices.includes(body.service)) {
    return { valid: false, error: 'Invalid service' };
  }

  return { valid: true };
}

/**
 * Main handler
 */
export async function POST(request: NextRequest): Promise<NextResponse<StartConversationResponse>> {
  logger.log('[conversation/start] Request received');
  try {
    // Lazy initialization - only initialize when handler is called
    logger.log('[conversation/start] Initializing Firebase Admin...');
    const auth = getAdminAuth();
    const db = getAdminDb();
    logger.log('[conversation/start] Firebase Admin initialized');

    logger.log('[conversation/start] Verifying token...');
    const userResult = await verifyBearerUser(
      request,
      auth,
      'conversation/start'
    );

    if ('error' in userResult) {
      logger.error('[conversation/start] Token verification failed:', userResult.error);
      return NextResponse.json(
        {
          conversationId: '',
          startedAt: '',
          status: 'error',
          error: 'unauthorized',
          message: userResult.error,
        },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;
    logger.log('[conversation/start] Token verified for user:', userId);

    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `conversation-start:${userId}:${clientIp}`;
    const rateLimit = await rateLimiters.strict.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
      return NextResponse.json(
        {
          conversationId: '',
          startedAt: '',
          status: 'error',
          error: 'rate-limited',
          message: 'Too many requests',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimit),
        }
      );
    }

    let body: unknown;
    try {
      const rawBody = await request.text();
      logger.log('[conversation/start] Raw body length:', rawBody?.length ?? 0);

      if (!rawBody || rawBody.trim() === '') {
        logger.error('[conversation/start] Empty body received');
        return NextResponse.json(
          {
            conversationId: '',
            startedAt: '',
            status: 'error',
            error: 'invalid-request',
            message: 'Empty request body',
          },
          { status: 400 }
        );
      }

      body = JSON.parse(rawBody);
      logger.log('[conversation/start] Body parsed successfully');
    } catch (parseError: unknown) {
      const parseErrorMessage =
        parseError instanceof Error ? parseError.message : String(parseError);
      logger.error('[conversation/start] JSON parse error:', parseErrorMessage);
      return NextResponse.json(
        {
          conversationId: '',
          startedAt: '',
          status: 'error',
          error: 'invalid-request',
          message: 'Invalid JSON body',
        },
        { status: 400 }
      );
    }

    const validation = validateRequest(body);

    if (!validation.valid) {
      logger.warn('Invalid request:', validation.error);
      return NextResponse.json(
        {
          conversationId: '',
          startedAt: '',
          status: 'error',
          error: 'invalid-request',
          message: validation.error,
        },
        { status: 400 }
      );
    }

    const { ageTier, service } = body as StartConversationRequest;

    // 3. Create conversation record with server timestamp
    const conversationRef = db.collection('conversations').doc();
    const now = new Date().toISOString();

    await conversationRef.set({
      id: conversationRef.id,
      userId,
      ageTier,
      service,
      startedAt: now,
      status: 'active',
      charged: false,
    });

    logger.log(`Created conversation ${conversationRef.id} for user ${userId}`);

    return NextResponse.json(
      {
        conversationId: conversationRef.id,
        startedAt: now,
        status: 'active',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Error in conversation/start:', error);

    return NextResponse.json(
      { 
        conversationId: '',
        startedAt: '',
        status: 'error',
        error: 'internal-error',
        message: 'An internal error occurred' 
      },
      { status: 500 }
    );
  }
}
