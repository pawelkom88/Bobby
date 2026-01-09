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

  // DEBUG: Collect request info for troubleshooting
  const debug = {
    runtime: 'nodejs',
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    method: request.method,
    hasBody: request.body !== null,
    timestamp: new Date().toISOString(),
  };

  try {
    const idToken = extractAndValidateToken(request, 'checkout_sessions');

    if (!idToken) {
      return NextResponse.json(
        { error: 'Invalid or missing authorization token', debug },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid or expired token',
          debug: {
            ...debug,
            tokenError: error instanceof Error ? error.message : String(error),
          },
        },
        { status: 401 }
      );
    }

    // 3. Extract userId from verified token (NEVER from request body)
    const userId = decodedToken.uid;

    // 4. Parse and validate request body - with detailed debugging
    let body;
    let rawBody: string | undefined;

    try {
      rawBody = await request.text();
    } catch (textError) {
      return NextResponse.json(
        {
          error: 'Failed to read request body',
          debug: {
            ...debug,
            textError: textError instanceof Error ? textError.message : String(textError),
          },
        },
        { status: 400 }
      );
    }

    if (!rawBody || rawBody.length === 0) {
      return NextResponse.json(
        {
          error: 'Request body is empty',
          debug: {
            ...debug,
            rawBodyLength: 0,
          },
        },
        { status: 400 }
      );
    }

    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON body',
          debug: {
            ...debug,
            rawBodyLength: rawBody.length,
            rawBodyPreview: rawBody.slice(0, 100),
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          },
        },
        { status: 400 }
      );
    }

    const { packType } = body;

    if (!packType || typeof packType !== 'string') {
      return NextResponse.json(
        { error: 'Missing packType in request body' },
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
      cancel_url: `${origin}/app/wybierz-numer?canceled=true`,
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
