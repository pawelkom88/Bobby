import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

// Force Node.js runtime for proper body handling with Stripe webhooks
export const runtime = 'nodejs';

const redactId = (value?: string) => {
  if (!value) return value;
  if (value.length <= 8) return '[REDACTED]';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

/**
 * POST /api/webhook
 *
 * Stripe webhook handler for processing payment events.
 *
 * Security:
 * - Verifies Stripe webhook signature before processing
 * - Uses Firestore transactions for atomic credit updates
 * - Implements idempotency check to prevent double-crediting
 *
 * Events handled:
 * - checkout.session.completed: Adds credits to user account
 * - checkout.session.expired: Logs for monitoring (optional)
 */
export async function POST(request: NextRequest) {
  console.warn('[webhook] Stripe webhook received');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is NOT configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // 1. Get raw body for signature verification
  let body: string;
  try {
    body = await request.text();
    console.warn('[webhook] Body read successfully, length:', body.length);
  } catch (bodyError: unknown) {
    const bodyErrorMessage =
      bodyError instanceof Error ? bodyError.message : String(bodyError);
    console.error('[webhook] Failed to read body:', bodyErrorMessage);
    return NextResponse.json(
      { error: 'Failed to read request body' },
      { status: 400 }
    );
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[webhook] Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  // Check if body is empty
  if (!body || body.length === 0) {
    console.error('[webhook] Empty body received');
    return NextResponse.json(
      { error: 'Empty request body' },
      { status: 400 }
    );
  }

  // 2. Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.warn('[webhook] Signature verification successful');
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error('[webhook] Signature verification failed:', errMessage);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // 3. Handle the event
  try {
    console.warn('[webhook] Event type:', event.type);
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn('Checkout session expired:', redactId(session.id));
        // Optional: Log for monitoring, no action needed
        break;
      }

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Return 200 to prevent Stripe from retrying (we've logged the error)
    // In production, you might want to return 500 for certain errors
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion
 * Adds credits to user account with idempotency check
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.warn(
    '[webhook] handleCheckoutCompleted for session:',
    redactId(session.id)
  );
  console.warn('[webhook] Payment status:', session.payment_status);

  // Only process paid sessions
  if (session.payment_status !== 'paid') {
    console.warn('[webhook] Session not paid, skipping:', redactId(session.id));
    return;
  }

  // Extract metadata (set during checkout session creation)
  const { userId, packType, credits: creditsStr } = session.metadata || {};

  if (!userId || !packType || !creditsStr) {
    console.error('[webhook] Missing metadata in session:', redactId(session.id), {
      userId: redactId(userId),
      packType,
      creditsStr,
    });
    throw new Error('Missing required metadata in checkout session');
  }
  console.warn('[webhook] Metadata extracted', {
    userId: redactId(userId),
    packType,
    creditsStr,
  });

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits) || credits <= 0) {
    console.error('Invalid credits value in metadata:', creditsStr);
    throw new Error('Invalid credits value in metadata');
  }

  const db = getAdminDb();
  console.warn('[webhook] Firestore project:', db.app.options.projectId);
  const purchasesRef = db.collection('purchases');
  const userRef = db.doc(`users/${userId}`);

  // Use Firestore transaction for atomic operations
  await db.runTransaction(async transaction => {
    // 1. Idempotency check: Check if this session was already processed
    const existingPurchaseQuery = await transaction.get(
      purchasesRef.where('stripeSessionId', '==', session.id).limit(1)
    );

    if (!existingPurchaseQuery.empty) {
      console.warn(
        'Session already processed (idempotency check):',
        redactId(session.id)
      );
      return; // Already processed, skip
    }

    // 2. Get current user document
    const userDoc = await transaction.get(userRef);
    const currentCredits = userDoc.exists ? userDoc.data()?.credits || 0 : 0;

    // 3. Update user credits
    if (userDoc.exists) {
      transaction.update(userRef, {
        credits: currentCredits + credits,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Create user document if it doesn't exist (edge case)
      transaction.set(userRef, {
        credits: credits,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 4. Create purchase record for audit trail
    const purchaseRef = purchasesRef.doc();
    transaction.set(purchaseRef, {
      userId,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      packType,
      credits,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    logger.log(
      `[webhook] SUCCESS: Added ${credits} credits to user ${userId} (session: ${session.id})`
    );
  });
  console.warn('[webhook] Transaction completed successfully');
}
