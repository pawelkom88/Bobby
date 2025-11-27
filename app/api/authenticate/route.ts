import { createClient } from '@deepgram/sdk';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // if (process.env.DEEPGRAM_ENV === 'development') {
  //   return NextResponse.json({
  //     key: process.env.DEEPGRAM_API_KEY ?? "",
  //   });
  // }
  // Rate limiting: 10 requests per 15 minutes per IP
  const rateLimit = checkRateLimit(request);
  if (rateLimit.limited) {
    logger.warn('Rate limit exceeded for authenticate endpoint', {
      remaining: rateLimit.remaining,
      resetTime: rateLimit.resetTime,
    });
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(
            (rateLimit.resetTime - Date.now()) / 1000
          ).toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        },
      }
    );
  }

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY ?? '');

  // 1. Create a temporary key with limited scope (usage:write is required for Voice Agent)
  let { result: tokenResult, error: tokenError } =
    await deepgram.auth.grantToken();

  if (tokenError) {
    logger.error('Error creating Deepgram token:', tokenError);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }

  if (!tokenResult) {
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ...tokenResult });
}
