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
import type { Service, AgeTier, Conversation } from '@/types';
import { FieldPath } from 'firebase-admin/firestore';

interface AssessedConversation {
  id: string;
  service: Service;
  ageTier: AgeTier;
  startedAt: string;
  endedAt?: string;
  messageCount: number;
  xpEarned: number;
  score?: number;
  feedback?: string[];
}

interface AssessedConversationsResponse {
  success: boolean;
  conversations?: AssessedConversation[];
  error?: string;
  message?: string;
}

async function verifyUserFromToken(
  request: NextRequest,
  auth: ReturnType<typeof getAdminAuth>
): Promise<{ userId: string } | { error: string; status: number }> {
  const tokenResult = extractBearerToken(request);

  if (!tokenResult.success) {
    logger.warn('Token extraction failed', {
      error: tokenResult.error,
      endpoint: 'conversations/assessed',
    });
    return { error: tokenResult.message, status: 401 };
  }

  try {
    const result = await verifyToken(
      token => auth.verifyIdToken(token),
      tokenResult.token
    );

    if (!result.success || !result.uid) {
      logger.warn('Token verification failed');
      return { error: 'Invalid token', status: 401 };
    }

    return { userId: result.uid };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Token verification error:', {
      error: errorMessage,
      code: error.code,
      stack: error.stack,
    });
    return { error: 'Invalid token', status: 401 };
  }
}

async function getUserAssessedConversations(
  userId: string,
  db: ReturnType<typeof getAdminDb>
): Promise<Conversation[]> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      logger.warn(`User document not found: ${userId}`);
      return [];
    }

    const userData = userDoc.data();
    return (userData?.conversations as Conversation[]) || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching user assessed conversations:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<AssessedConversationsResponse>> {
  try {
    // Lazy initialization - only initialize when handler is called
    const auth = getAdminAuth();
    const db = getAdminDb();

    const userResult = await verifyUserFromToken(request, auth);

    if ('error' in userResult) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: userResult.error },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;

    const clientIp = getClientIP(request);
    const rateLimitIdentifier = `${userId}:${clientIp}`;

    const rateLimit = await rateLimiters.api.isRateLimited(rateLimitIdentifier);

    if (rateLimit.limited) {
      logger.warn('Rate limit exceeded for assessed conversations endpoint', {
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

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || '50', 10) || 50, 100);

    const assessedConversations = await getUserAssessedConversations(
      userId,
      db
    );

    const assessmentMap = new Map<
      string,
      { xpEarned: number; score?: number; feedback?: string[] }
    >();
    assessedConversations.forEach((conv: Conversation) => {
      if (conv.conversationId) {
        assessmentMap.set(conv.conversationId, {
          xpEarned: conv.xpEarned,
          score: conv.score,
          feedback: conv.feedback,
        });
      }
    });

    const conversationIds = Array.from(assessmentMap.keys());

    if (conversationIds.length === 0) {
      if (assessedConversations.length > 0) {
        logger.log(
          `No conversation IDs found for user ${userId}, returning legacy entries`
        );

        const legacyConversations: AssessedConversation[] =
          assessedConversations.map(
          (conv: Conversation) => ({
            id: conv.conversationId || conv.timestamp,
            service: conv.service || 'fire',
            ageTier: conv.ageTier || 1,
            startedAt: conv.timestamp,
            endedAt: conv.timestamp,
            messageCount: 0,
            xpEarned: conv.xpEarned || 0,
            score: conv.score,
            feedback: conv.feedback,
          })
        );

        legacyConversations.sort((a, b) => {
          const aTime = new Date(a.endedAt || a.startedAt).getTime();
          const bTime = new Date(b.endedAt || b.startedAt).getTime();
          return bTime - aTime;
        });

        return NextResponse.json(
          {
            success: true,
            conversations: legacyConversations.slice(0, limit),
          },
          { status: 200 }
        );
      }

      logger.log(`No assessed conversations found for user ${userId}`);
      return NextResponse.json(
        {
          success: true,
          conversations: [],
        },
        { status: 200 }
      );
    }

    const batchSize = 10;
    const allConversations: AssessedConversation[] = [];

    for (let i = 0; i < conversationIds.length; i += batchSize) {
      const batch = conversationIds.slice(i, i + batchSize);

      const snapshot = await db
        .collection('conversations')
        .where('userId', '==', userId)
        .where('status', '==', 'completed')
        .where(FieldPath.documentId(), 'in', batch)
        .get();

      const conversations = snapshot.docs.map(doc => {
        const data = doc.data();
        const assessment = assessmentMap.get(doc.id);

        return {
          id: doc.id,
          service: data.service || 'fire',
          ageTier: data.ageTier || 1,
          startedAt: data.startedAt || '',
          endedAt: data.endedAt,
          messageCount: data.messages?.length || 0,
          xpEarned: assessment?.xpEarned || 0,
          score: assessment?.score,
          feedback: assessment?.feedback,
        } as AssessedConversation;
      });

      allConversations.push(...conversations);
    }

    allConversations.sort((a, b) => {
      const aTime = new Date(a.endedAt || a.startedAt).getTime();
      const bTime = new Date(b.endedAt || b.startedAt).getTime();
      return bTime - aTime;
    });

    const limitedConversations = allConversations.slice(0, limit);

    logger.log(
      `Fetched ${limitedConversations.length} assessed conversations for user ${userId}`
    );

    return NextResponse.json(
      {
        success: true,
        conversations: limitedConversations,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching assessed conversations:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

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
