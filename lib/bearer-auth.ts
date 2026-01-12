import { NextRequest, type NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/auth-utils';
import { verifyToken } from '@/lib/token-verifier';
import { logger } from '@/lib/logger';
import type { getAdminAuth } from '@/lib/firebase-admin';
import { getClientIP } from '@/lib/rateLimit';

export type BearerUserResult =
  | { userId: string }
  | { error: string; status: number };

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

interface RateLimiter {
  isRateLimited: (identifier: string) => Promise<RateLimitResult>;
}

export async function verifyBearerUser(
  request: NextRequest,
  auth: ReturnType<typeof getAdminAuth>,
  endpoint: string
): Promise<BearerUserResult> {
  const tokenResult = extractBearerToken(request);

  if (!tokenResult.success) {
    logger.warn('Token extraction failed', {
      error: tokenResult.error,
      endpoint,
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
  } catch (error: unknown) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: string }).code
        : undefined;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    logger.warn('Token verification error:', {
      code: errorCode,
      message: errorMessage,
      endpoint,
    });
    return { error: 'Invalid token', status: 401 };
  }
}

export async function enforceBearerRateLimit<T>(
  request: NextRequest,
  userId: string,
  limiter: RateLimiter,
  identifierPrefix: string,
  onLimited: (data: RateLimitResult) => NextResponse<T>
): Promise<NextResponse<T> | null> {
  const clientIp = getClientIP(request);
  const rateLimitIdentifier = `${identifierPrefix}:${userId}:${clientIp}`;
  const rateLimit = await limiter.isRateLimited(rateLimitIdentifier);

  if (rateLimit.limited) {
    return onLimited(rateLimit);
  }

  return null;
}
