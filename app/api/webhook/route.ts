import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // 1. Get raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    logger.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  // 2. Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    // Log detailed error server-side only
    logger.error('Webhook signature verification failed:', err);
    // Return generic error to client (CWE-209)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // 3. Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.log('Checkout session expired:', session.id);
        // Optional: Log for monitoring, no action needed
        break;
      }

      default:
        logger.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
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
  // Only process paid sessions
  if (session.payment_status !== 'paid') {
    logger.log('Session not paid, skipping:', session.id);
    return;
  }

  // Extract metadata (set during checkout session creation)
  const { userId, packType, credits: creditsStr } = session.metadata || {};

  if (!userId || !packType || !creditsStr) {
    logger.error('Missing metadata in session:', session.id);
    throw new Error('Missing required metadata in checkout session');
  }

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits) || credits <= 0) {
    logger.error('Invalid credits value in metadata:', creditsStr);
    throw new Error('Invalid credits value in metadata');
  }

  const db = getAdminDb();
  const purchasesRef = db.collection('purchases');
  const userRef = db.doc(`users/${userId}`);

  // Use Firestore transaction for atomic operations
  await db.runTransaction(async transaction => {
    // 1. Idempotency check: Check if this session was already processed
    const existingPurchaseQuery = await transaction.get(
      purchasesRef.where('stripeSessionId', '==', session.id).limit(1)
    );

    if (!existingPurchaseQuery.empty) {
      logger.log('Session already processed (idempotency check):', session.id);
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
      `Added ${credits} credits to user ${userId} (session: ${session.id})`
    );
  });
}
