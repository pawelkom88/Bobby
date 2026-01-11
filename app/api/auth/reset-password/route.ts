import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/rateLimit';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { hashForRateLimit, isValidEmail, maskEmail } from '@/lib/email-utils';

/**
 * POST /api/auth/reset-password
 *
 * Sends a password reset email to the user
 *
 * Security:
 * - Dual rate limiting (IP + email) to prevent email bombing
 * - Does not reveal if email exists (prevents enumeration)
 * - Uses Firebase Admin SDK to generate secure reset links
 * - Custom email template via our mailer system
 * - PII masked in logs for GDPR/privacy compliance
 *
 * Request:
 * - Body: { email: string }
 *
 * Response:
 * - 200: { message: 'If an account exists, a password reset link has been sent' }
 * - 400: Invalid email or request
 * - 415: Invalid Content-Type
 * - 429: Rate limited
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIP(request);

  try {
    // 1. IP-based rate limiting (before any processing)
    const ipRateLimit = await rateLimiters.auth.isRateLimited(
      `reset-password:ip:${clientIp}`
    );

    if (ipRateLimit.limited) {
      logger.warn('Password reset IP rate limit exceeded', {
        ip: clientIp,
        userAgent: request.headers.get('user-agent'),
      });

      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(ipRateLimit),
        }
      );
    }

    // 2. Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.toLowerCase().includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    // 3. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // 4. Validate email
    const { email } = body;
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = await hashForRateLimit(normalizedEmail);

    // 5. Email-based rate limiting (prevents email bombing)
    const emailRateLimit = await rateLimiters.passwordReset.isRateLimited(
      `reset-password:email:${emailHash}`
    );

    if (emailRateLimit.limited) {
      logger.warn('Password reset email rate limit exceeded', {
        emailHash,
        ip: clientIp,
      });

      // Return success to prevent enumeration
      return NextResponse.json({
        message:
          'If an account exists, a password reset link has been sent to your email.',
      });
    }

    // 6. Validate app URL configuration
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      logger.error('NEXT_PUBLIC_APP_URL not configured');
      throw new Error('Server configuration error');
    }

    // 7. Generate password reset link
    const auth = getAdminAuth();
    let resetLink: string;

    try {
      const firebaseResetLink = await auth.generatePasswordResetLink(
        normalizedEmail,
        {
          url: `${appUrl}/reset-password`,
          handleCodeInApp: false, // Changed to false so we get the oobCode
        }
      );

      const url = new URL(firebaseResetLink);
      const oobCode = url.searchParams.get('oobCode');
      if (!oobCode) throw new Error('Missing oobCode');

      const appResetUrl = new URL('/en/reset-password', appUrl); // include locale
      appResetUrl.searchParams.set('oobCode', oobCode);
      resetLink = appResetUrl.toString();

      // Create direct link to our app
      resetLink = `${appUrl}/en/reset-password?oobCode=${oobCode}`;
      // resetLink = `${appUrl}/${locale}/reset-password?oobCode=${oobCode}`;

      logger.info('Generated password reset link', {
        emailMasked: maskEmail(normalizedEmail),
        emailHash,
        firebaseResetLink,
        appResetLink: resetLink, // Log the actual link sent to user
        ip: clientIp,
      });
    } catch (error) {
      logger.warn('Password reset link generation failed', {
        emailMasked: maskEmail(normalizedEmail),
        emailHash,
        errorCode: (error as any)?.code,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: clientIp,
      });

      return NextResponse.json({
        message:
          'If an account exists, a password reset link has been sent to your email.',
      });
    }

    // 8. Send email
    try {
      await sendPasswordResetEmail(normalizedEmail, resetLink);

      logger.info('Password reset email sent', {
        emailMasked: maskEmail(normalizedEmail),
        emailHash,
        ip: clientIp,
      });
    } catch (error) {
      logger.error('Failed to send password reset email', {
        emailMasked: maskEmail(normalizedEmail),
        emailHash,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: clientIp,
      });

      // Return error instead of success
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    // 9. Success response
    return NextResponse.json({
      message:
        'If an account exists, a password reset link has been sent to your email.',
    });
  } catch (error) {
    logger.error('Password reset request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: clientIp,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
