import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { verifyIdToken } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { extractAndValidateToken } from '@/lib/auth-utils';
import { getCurrencyConfig } from '@/lib/currency';

// Force Node.js runtime - Netlify Edge doesn't forward POST bodies correctly
 
export const runtime = 'nodejs';

function getLocalizedInvoiceText(locale: string) {
  if (locale === 'pl') {
    return {
      footer: 'Dziękujemy za wybranie Bobbiego - Twojego asystenta AI',
      platform: 'Platforma',
      platformValue: 'Bobby',
      creditsPurchased: 'Kredytów',
      descriptionPrefix: 'Bobby',
    };
  }

  // Default to English
  return {
    footer: 'Thank you for choosing Bobby - Your AI Assistant',
    platform: 'Platform',
    platformValue: 'Bobby',
    creditsPurchased: 'Credits Purchased',
    descriptionPrefix: 'Bobby',
  };
}

function toStripeLocale(locale: string) {
  if (locale === 'pl') return 'pl' as const;
  if (locale === 'en') return 'en' as const;
  return undefined;
}

function getCreditPacks(locale: string) {
  const currency = getCurrencyConfig(locale);

  // Map locale to appropriate Stripe price IDs
  if (currency.code === 'PLN') {
    return {
      rookie: {
        priceId: process.env.STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK_PLN!,
        credits: 1,
        name: 'Pakiet Początkujący',
      },
      hero: {
        priceId: process.env.STRIPE_BOBBY_PRICE_ID_HERO_PACK_PLN!,
        credits: 2,
        name: 'Paket Bohater',
      },
    };
  }

  // Default to GBP
  return {
    rookie: {
      priceId: process.env.STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK!,
      credits: 1,
      name: 'Rookie Pack',
    },
    hero: {
      priceId: process.env.STRIPE_BOBBY_PRICE_ID_HERO_PACK!,
      credits: 2,
      name: 'Hero Pack',
    },
  };
}

function isValidPackType(
  packType: string,
  locale: string
): packType is PackType {
  const CREDIT_PACKS = getCreditPacks(locale);
  return packType in CREDIT_PACKS;
}

type PackType = 'rookie' | 'hero';

export async function POST(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get('locale') || 'en';
  const stripeLocale = toStripeLocale(localeParam);

  // Get packType from query params (Netlify strips POST bodies)
  const packType = request.nextUrl.searchParams.get('packType');

  try {
    const idToken = extractAndValidateToken(request, 'checkout_sessions');

    if (!idToken) {
      return NextResponse.json(
        { error: 'Invalid or missing authorization token' },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Extract userId from verified token (NEVER from request body)
    const userId = decodedToken.uid;

    if (!packType || typeof packType !== 'string') {
      return NextResponse.json(
        { error: 'Missing packType query parameter' },
        { status: 400 }
      );
    }

    if (!isValidPackType(packType, localeParam)) {
      const CREDIT_PACKS = getCreditPacks(localeParam);
      return NextResponse.json(
        {
          error: `Invalid packType. Must be one of: ${Object.keys(CREDIT_PACKS).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 5. Get pack configuration from server-side config (NEVER trust client)
    const CREDIT_PACKS = getCreditPacks(localeParam);
    const pack = CREDIT_PACKS[packType];

    // 6. Get origin for redirect URLs (use forwarded headers for Netlify/proxies)
    const headersList = await headers();
    const proto = headersList.get('x-forwarded-proto') ?? 'https';
    const host =
      headersList.get('x-forwarded-host') ?? headersList.get('host');
    const origin = host
      ? `${proto}://${host}`
      : process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    // 7. Create Stripe checkout session
    const successUrl = `${origin}/app/success?session_id={CHECKOUT_SESSION_ID}&test=1`;

    // Get localized text for invoice
    const localizedText = getLocalizedInvoiceText(localeParam);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: pack.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `${localizedText.descriptionPrefix} ${pack.name} - ${pack.credits} Credit${pack.credits > 1 ? 's' : ''}`,
          metadata: {
            userId,
            packType,
            credits: pack.credits.toString(),
            platform: 'bobby-app',
            locale: localeParam,
          },
          footer: localizedText.footer,
          rendering_options: {
            amount_tax_display: 'include_inclusive_tax',
          },
          // Custom fields for additional information
          custom_fields: [
            {
              name: localizedText.platform,
              value: localizedText.platformValue,
            },
            {
              name: localizedText.creditsPurchased,
              value: `${pack.credits} Credit${pack.credits > 1 ? 's' : ''}`,
            },
          ],
        },
      },
      ...(stripeLocale ? { locale: stripeLocale } : {}),
      success_url: successUrl,
      cancel_url: `${origin}/app/select-package?canceled=true`,
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
