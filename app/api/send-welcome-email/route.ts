import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/mailer';
import { logger } from '@/lib/logger';
import { rateLimiters, createRateLimitHeaders } from '@/lib/rateLimit';
import { verifyIdToken, getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 0. Request size check
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    // 1. Parse body
    let body: { name?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Optional body
    }

    // 2. Validate name if provided
    const name = body.name?.slice(0, 100).trim();

    // 3. Auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    if (!idToken) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }

    // 4. Verify token
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not available' },
        { status: 400 }
      );
    }

    // 5. Rate limit by userId (using pre-configured limiter)
    const rateLimit = await rateLimiters.welcomeEmail.isRateLimited(userId);

    if (rateLimit.limited) {
      logger.warn('Welcome email rate limit exceeded', { userId });
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

    // 6. Check if already sent
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(userId).get();

    if (userDoc.exists && userDoc.data()?.welcomeEmailSent) {
      logger.info('Welcome email already sent', { userId });
      return NextResponse.json({ success: true, alreadySent: true });
    }

    // 7. Send email
    await sendWelcomeEmail(email, name || decodedToken.name || 'there');

    // 8. Mark as sent
    await db.collection('users').doc(userId).set(
      {
        welcomeEmailSent: true,
        welcomeEmailSentAt: new Date().toISOString(),
      },
      { merge: true }
    );

    logger.info('Welcome email sent', { userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Unexpected error in send-welcome-email');
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
