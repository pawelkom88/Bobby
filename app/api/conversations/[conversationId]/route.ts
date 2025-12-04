/**
 * GET /api/conversations/[conversationId]
 * Returns a single conversation with full messages
 * 
 * Security:
 * - Requires valid Firebase ID token
 * - Verifies user owns the conversation
 * - Rate limited
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/token-verifier';
import { getConversationById, userOwnsConversation } from '@/lib/conversation-storage';
import { logger } from '@/lib/logger';
import { extractBearerToken } from '@/lib/auth-utils';
import type { StoredConversation } from '@/types';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';

const auth = getAdminAuth();

interface ConversationDetailResponse {
  success: boolean;
  conversation?: StoredConversation;
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
      endpoint: 'conversations/detail'
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
 * GET handler - Get single conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
): Promise<NextResponse<ConversationDetailResponse>> {
  try {
    const { conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'invalid-request', message: 'Conversation ID is required' },
        { status: 400 }
      );
    }

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
      logger.warn('Rate limit exceeded for conversation detail endpoint', {
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

    // 3. Check ownership
    const isOwner = await userOwnsConversation(userId, conversationId);
    if (!isOwner) {
      logger.warn(`User ${userId} attempted to access conversation ${conversationId} they don't own`);
      return NextResponse.json(
        { success: false, error: 'not-found', message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 4. Fetch conversation
    const conversation = await getConversationById(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'not-found', message: 'Conversation not found' },
        { status: 404 }
      );
    }

    logger.log(`Fetched conversation ${conversationId} for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        conversation,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error fetching conversation:', error);

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
