import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { verifyIdToken } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { extractAndValidateToken } from '@/lib/auth-utils';
import { getCurrencyConfig } from '@/lib/currency';
import { getServerEnv } from '@/lib/env';

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

const DEV_PRICE_METADATA = [
  {
    envVar: 'STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK',
    locale: 'en',
    packType: 'rookie',
  },
  {
    envVar: 'STRIPE_BOBBY_PRICE_ID_HERO_PACK',
    locale: 'en',
    packType: 'hero',
  },
  {
    envVar: 'STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK_PLN',
    locale: 'pl',
    packType: 'rookie',
  },
  {
    envVar: 'STRIPE_BOBBY_PRICE_ID_HERO_PACK_PLN',
    locale: 'pl',
    packType: 'hero',
  },
];

function getCreditPacks(locale: string) {
  const currency = getCurrencyConfig(locale);

  const gbpPacks = {
    rookie: {
      priceId: getServerEnv('STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK'),
      name: 'Rookie Pack',
      credits: 2,
    },
    hero: {
      priceId: getServerEnv('STRIPE_BOBBY_PRICE_ID_HERO_PACK'),
      name: 'Hero Pack',
      credits: 5,
    },
  };

  // Map locale to appropriate Stripe price IDs
  if (currency.code === 'PLN') {
    const rookiePln = process.env.STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK_PLN;
    const heroPln = process.env.STRIPE_BOBBY_PRICE_ID_HERO_PACK_PLN;

    if (!rookiePln || !heroPln) {
      logger.warn(
        'PLN pricing requested but PLN price IDs are missing. Falling back to GBP.',
        { locale }
      );
      return gbpPacks;
    }

    return {
      rookie: {
        priceId: rookiePln,
        name: 'Pakiet Początkujący',
        credits: 2,
      },
      hero: {
        priceId: heroPln,
        name: 'Paket Bohater',
        credits: 5,
      },
    };
  }

  // Default to GBP
  return gbpPacks;
}

function isValidPackType(
  packType: string,
  locale: string
): packType is PackType {
  const CREDIT_PACKS = getCreditPacks(locale);
  return packType in CREDIT_PACKS;
}

type PackType = 'rookie' | 'hero';

let devCreditsValidation: Promise<void> | null = null;

async function validateCreditsMetadataOnce() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  if (!devCreditsValidation) {
    devCreditsValidation = (async () => {
      await Promise.all(
        DEV_PRICE_METADATA.map(async entry => {
          const priceId = process.env[entry.envVar];

          if (!priceId) {
            logger.warn('Missing Stripe price env var for credits validation', {
              ...entry,
            });
            return;
          }

          try {
            const price = await stripe.prices.retrieve(priceId, {
              expand: ['product'],
            });
            const priceCredits = price.metadata?.credits;
            const productCredits =
              typeof price.product === 'string' ||
              !price.product ||
              ('deleted' in price.product && price.product.deleted)
                ? undefined
                : price.product.metadata?.credits;
            const creditsStr = priceCredits ?? productCredits ?? '';
            const credits = parseInt(creditsStr, 10);

            if (!creditsStr || Number.isNaN(credits) || credits <= 0) {
              logger.warn(
                'Missing or invalid credits metadata on Stripe price',
                {
                  ...entry,
                  priceId,
                  priceCredits,
                  productCredits,
                }
              );
            }
          } catch (error) {
            logger.warn('Failed to validate Stripe price metadata', {
              ...entry,
              priceId,
              error:
                error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })
      );
    })();
  }

  await devCreditsValidation;
}

export async function POST(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get('locale') || 'en';
  const stripeLocale = toStripeLocale(localeParam);

  // Get packType from query params (Netlify strips POST bodies)
  const packType = request.nextUrl.searchParams.get('packType');

  try {
    // Dev-only preflight to catch missing Stripe credits metadata early.
    await validateCreditsMetadataOnce();

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
    const credits = pack.credits;

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
          description: `${localizedText.descriptionPrefix} ${pack.name} - ${credits} Credit${credits > 1 ? 's' : ''}`,
          metadata: {
            userId,
            packType,
            credits: credits.toString(),
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
              value: `${credits} Credit${credits > 1 ? 's' : ''}`,
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
        credits: credits.toString(),
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
