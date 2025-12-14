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
import { verifyToken } from '@/lib/token-verifier';
import { logger } from '@/lib/logger';
import { extractBearerToken } from '@/lib/auth-utils';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';

// Initialize Firebase Admin lazily (runtime only)
const auth = getAdminAuth();
const db = getAdminDb();

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
 * Extracts and verifies user from token
 */
async function verifyUserFromToken(
  request: NextRequest
): Promise<{ userId: string } | { error: string; status: number }> {
  const tokenResult = extractBearerToken(request);
  
  if (!tokenResult.success) {
    logger.warn('Token extraction failed', {
      error: tokenResult.error,
      endpoint: 'conversation/start'
    });
    return { error: tokenResult.message, status: 401 };
  }

  try {
    const result = await verifyToken(
      (token) => auth.verifyIdToken(token),
      tokenResult.token
    );

    if (!result.success || !result.uid) {
      logger.warn('Token verification failed');
      return { error: 'Invalid token', status: 401 };
    }

    return { userId: result.uid };
  } catch (error: any) {
    logger.warn('Token verification error:', error.code);
    return { error: 'Invalid token', status: 401 };
  }
}

/**
 * Main handler
 */
export async function POST(request: NextRequest): Promise<NextResponse<StartConversationResponse>> {
  try {
    const userResult = await verifyUserFromToken(request);

    if ('error' in userResult) {
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
      body = await request.json();
    } catch {
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
  } catch (error: any) {
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
