import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { extractAndValidateToken } from '@/lib/auth-utils';
import { createRateLimitHeaders, getClientIP } from '@/lib/rateLimit';

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

interface RateLimiter {
  isRateLimited: (identifier: string) => Promise<RateLimitResult>;
}

export async function requireSessionUser(
  request: NextRequest,
  endpoint: string,
  rateLimitPrefix: string,
  rateLimiter: RateLimiter
): Promise<{ userId: string } | NextResponse> {
  const idToken = extractAndValidateToken(request, endpoint);
  if (!idToken) {
    return NextResponse.json(
      { error: 'Invalid or missing authorization token' },
      { status: 401 }
    );
  }

  let decodedToken: { uid: string };
  try {
    decodedToken = await verifyIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  const userId = decodedToken.uid;
  const clientIp = getClientIP(request);
  const rateLimitIdentifier = `${rateLimitPrefix}:${userId}:${clientIp}`;
  const rateLimit = await rateLimiter.isRateLimited(rateLimitIdentifier);

  if (rateLimit.limited) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimit),
      }
    );
  }

  return { userId };
}
