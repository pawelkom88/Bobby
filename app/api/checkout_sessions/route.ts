import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { verifyIdToken } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

/**
 * Credit pack configuration - SERVER-SIDE ONLY
 * Never trust client-provided prices or credit amounts
 *
 * Each credit = 1 practice call (5 minutes max)
 */
const CREDIT_PACKS = {
  responder: {
    priceId: process.env.STRIPE_BOBBY_PRICE_ID_RESPONSED_PACK!,
    credits: 2,
    name: 'Responder Pack',
  },
  hero: {
    priceId: process.env.STRIPE_BOBBY_PRICE_ID_HERO_PACK!,
    credits: 5,
    name: 'Hero Pack',
  },
} as const;

type PackType = keyof typeof CREDIT_PACKS;

function isValidPackType(packType: string): packType is PackType {
  return packType in CREDIT_PACKS;
}

/**
 * POST /api/checkout_sessions
 *
 * Creates a Stripe checkout session for purchasing credits.
 *
 * Security:
 * - Requires valid Firebase ID token in Authorization header
 * - userId is extracted from verified token (NEVER from request body)
 * - Pack configuration (price, credits) is server-side only
 *
 * Request:
 * - Headers: Authorization: Bearer <firebase_id_token>
 * - Body: { packType: 'responder' | 'hero' }
 *
 * Response:
 * - 200: { url: string } - Stripe checkout URL
 * - 400: Invalid packType
 * - 401: Missing or invalid token
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract and verify Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing token in Authorization header' },
        { status: 401 }
      );
    }

    // 2. Verify token with Firebase Admin SDK
    let decodedToken;
    try {
      console.log('[Checkout] Verifying Firebase ID token');
      decodedToken = await verifyIdToken(idToken);
      console.log('[Checkout] Token verified successfully for user:', decodedToken.uid);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Checkout] Token verification failed:', errorMsg);
      logger.error('Token verification failed:', errorMsg);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 3. Extract userId from verified token (NEVER from request body)
    const userId = decodedToken.uid;

    // 4. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { packType } = body;

    if (!packType || typeof packType !== 'string') {
      return NextResponse.json(
        { error: 'Missing packType in request body' },
        { status: 400 }
      );
    }

    if (!isValidPackType(packType)) {
      return NextResponse.json(
        {
          error: `Invalid packType. Must be one of: ${Object.keys(CREDIT_PACKS).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 5. Get pack configuration from server-side config (NEVER trust client)
    const pack = CREDIT_PACKS[packType];

    // 6. Get origin for redirect URLs
    const headersList = await headers();
    const origin =
      headersList.get('origin') ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3000';

    // 7. Create Stripe checkout session
    const successUrl = `${origin}/app/success?session_id={CHECKOUT_SESSION_ID}&test=1`;
    logger.log('Checkout - Success URL being set:', successUrl);
    logger.log('Checkout - Origin used:', origin);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: pack.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: `${origin}/app/dial?canceled=true`,
      // Store metadata for webhook processing
      metadata: {
        userId,
        packType,
        credits: pack.credits.toString(),
      },
      // Session expires in 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      automatic_tax: { enabled: true },
      // Optional: Pre-fill customer email if available
      ...(decodedToken.email && { customer_email: decodedToken.email }),
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    // 8. Return checkout URL (client will redirect)
    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Log detailed error server-side only
    logger.error('Checkout session creation error:', error);

    // Return generic error message to client (CWE-209)
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
