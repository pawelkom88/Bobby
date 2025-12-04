/**
 * GET /api/conversations
 * Returns list of completed conversations for the authenticated user
 * 
 * Security:
 * - Requires valid Firebase ID token
 * - Only returns conversations owned by the authenticated user
 * - Rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/token-verifier';
import { getConversationsForUser } from '@/lib/conversation-storage';
import { logger } from '@/lib/logger';
import { extractBearerToken } from '@/lib/auth-utils';
import type { ConversationListItem } from '@/types';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';

const auth = getAdminAuth();

interface ConversationsListResponse {
  success: boolean;
  conversations?: ConversationListItem[];
  error?: string;
  message?: string;
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
      endpoint: 'conversations/list'
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
 * GET handler - List conversations
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ConversationsListResponse>> {
  try {
    // 1. Verify user from token
    const userResult = await verifyUserFromToken(request);

    if ('error' in userResult) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: userResult.error },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;

    // 2. Rate limiting: Use userId + IP for better protection
    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `${userId}:${clientIp}`;

    // Use API rate limiter (100 requests per 15 minutes)
    const rateLimit = await rateLimiters.api.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
      logger.warn('Rate limit exceeded for conversations endpoint', {
        userId,
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'rate_limited',
          message: 'Too many requests',
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimit),
        }
      );
    }

    // 3. Get limit from query params (default 50, max 100)
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || '50', 10) || 50, 100);

    // 4. Fetch conversations
    const conversations = await getConversationsForUser(userId, limit);

    logger.log(`Fetched ${conversations.length} conversations for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        conversations,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error fetching conversations:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'internal-error',
        message: 'An internal error occurred',
      },
      { status: 500 }
    );
  }
}
