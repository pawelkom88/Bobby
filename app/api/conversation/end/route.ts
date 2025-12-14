/**
 * POST /api/conversation/end
 * Marks a conversation as ended with server-side timestamp
 * 
 * Security:
 * - Requires valid Firebase ID token
 * - Verifies user owns the conversation
 * - Server-side timestamp (client cannot manipulate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/token-verifier';
import { validateOwnership, OwnershipValidationError } from '@/lib/ownership-validator';
import { logger } from '@/lib/logger';
import { extractBearerToken } from '@/lib/auth-utils';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';
import { ConversationMessage } from '@/types';

// Initialize Firebase Admin lazily (runtime only)
const auth = getAdminAuth();
const db = getAdminDb();

interface EndConversationRequest {
  conversationId: string;
  messages?: ConversationMessage[];
}

interface EndConversationResponse {
  conversationId: string;
  endedAt: string;
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

  if (!body.conversationId || typeof body.conversationId !== 'string') {
    return { valid: false, error: 'conversationId is required and must be a string' };
  }

  if (body.messages !== undefined) {
    if (!Array.isArray(body.messages)) {
      return { valid: false, error: 'messages must be an array' };
    }
    for (const msg of body.messages) {
      if (!msg.type || !['user', 'agent'].includes(msg.type)) {
        return { valid: false, error: 'Each message must have type "user" or "agent"' };
      }
      if (typeof msg.text !== 'string') {
        return { valid: false, error: 'Each message must have a text string' };
      }
    }
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
      endpoint: 'conversation/end'
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
 * Fetches conversation from Firestore
 */
async function getConversation(conversationId: string) {
  try {
    const doc = await db.collection('conversations').doc(conversationId).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error('Error fetching conversation:', error);
    throw error;
  }
}

/**
 * Main handler
 */
export async function POST(request: NextRequest): Promise<NextResponse<EndConversationResponse>> {
  try {
    const userResult = await verifyUserFromToken(request);

    if ('error' in userResult) {
      return NextResponse.json(
        { 
          conversationId: '',
          endedAt: '',
          status: 'error',
          error: 'unauthorized',
          message: userResult.error 
        },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;

    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `conversation-end:${userId}:${clientIp}`;
    const rateLimit = await rateLimiters.strict.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
      return NextResponse.json(
        {
          conversationId: '',
          endedAt: '',
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
          endedAt: '',
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
          endedAt: '',
          status: 'error',
          error: 'invalid-request',
          message: validation.error,
        },
        { status: 400 }
      );
    }

    const { conversationId, messages } = body as EndConversationRequest;

    // 3. Verify user owns conversation
    try {
      await validateOwnership(userId, conversationId, getConversation);
    } catch (error: any) {
      if (error instanceof OwnershipValidationError) {
        if (error.code === 'conversation/not-found') {
          logger.warn(`Conversation ${conversationId} not found`);
          return NextResponse.json(
            { 
              conversationId: '',
              endedAt: '',
              status: 'error',
              error: 'conversation-not-found',
              message: 'Conversation not found' 
            },
            { status: 404 }
          );
        }
        if (error.code === 'auth/not-authorized') {
          logger.warn(`User ${userId} not authorized for conversation ${conversationId}`);
          return NextResponse.json(
            { 
              conversationId: '',
              endedAt: '',
              status: 'error',
              error: 'not-authorized',
              message: 'Not authorized' 
            },
            { status: 403 }
          );
        }
      }
      throw error;
    }

    // 4. Update conversation with server-side end timestamp and messages
    const now = new Date().toISOString();
    const updateData: Record<string, any> = {
      endedAt: now,
      status: 'completed',
    };

    if (messages && messages.length > 0) {
      updateData.messages = messages.map(msg => ({
        type: msg.type,
        text: msg.text,
        timestamp: msg.timestamp || now,
      }));
      logger.log(`Saving ${messages.length} messages for conversation ${conversationId}`);
    }

    await db.collection('conversations').doc(conversationId).update(updateData);

    logger.log(`Ended conversation ${conversationId} for user ${userId}`);

    return NextResponse.json(
      {
        conversationId,
        endedAt: now,
        status: 'completed',
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error in conversation/end:', error);

    return NextResponse.json(
      { 
        conversationId: '',
        endedAt: '',
        status: 'error',
        error: 'internal-error',
        message: 'An internal error occurred' 
      },
      { status: 500 }
    );
  }
}
