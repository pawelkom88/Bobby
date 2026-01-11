import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { headers } from 'next/headers';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { notFound } from 'next/navigation';
import { OptimizedProviders } from '@/components/OptimizedProviders';
import { nunito, luckiestGuy } from '@/lib/fonts';
import { routing } from '@/i18n/routing';
import { locales } from '@/i18n/locales';
import CspNonceDebugger from '@/components/CspNonceDebugger';
import { ViewTransition } from 'react';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'metadata' });

  const title = t('title');
  const description = t('description');

  return {
    metadataBase: new URL('http://readywithbobby.online/'),
    title,
    description,
    alternates: {
      canonical: 'http://readywithbobby.online/',
      languages: {
        en: '/en',
        pl: '/pl',
      },
    },
    openGraph: {
      title,
      description,
      images: [
        {
          url: '/bobby-OG-image.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
      locale: locale === 'pl' ? 'pl_PL' : 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/bobby-OG-image.png'],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const nonce = (await headers()).get('x-csp-nonce') ?? undefined;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return (
    <html lang={locale}>
      <head>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          href="/favicon-16x16.png"
          sizes="16x16"
          type="image/png"
        />
        <link
          rel="icon"
          href="/favicon-32x32.png"
          sizes="32x32"
          type="image/png"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link rel="preconnect" href="https://firebase.googleapis.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://bobby-11d45.firebaseapp.com" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link
          rel="preload"
          as="audio"
          href="/sfx/bttf-dial-1.mp3"
          type="audio/mpeg"
        />
        <link
          rel="preload"
          as="audio"
          href="/sfx/bttf-dial-2.mp3"
          type="audio/mpeg"
        />
        <link
          rel="preload"
          as="audio"
          href="/sfx/bttf-dial-3.mp3"
          type="audio/mpeg"
        />
        {nonce ? (
          <script
            id="structured-data"
            type="application/ld+json"
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: t('title'),
                description: t('description'),
                applicationCategory: 'EducationalApplication',
                operatingSystem: t('structuredData.operatingSystem'),
                url:
                  process.env.NEXT_PUBLIC_BASE_URL || 'https://bobby-app.com',
                author: {
                  '@type': 'Organization',
                  name: t('structuredData.authorName'),
                },
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: locale === 'pl' ? 'PLN' : 'GBP',
                },
              }),
            }}
          />
        ) : null}
      </head>
      <body className={`${nunito.variable} ${luckiestGuy.variable} font-sans`}>
        <NextIntlClientProvider messages={messages}>
          <ViewTransition>
            <OptimizedProviders>{children}</OptimizedProviders>
          </ViewTransition>
        </NextIntlClientProvider>
        <CspNonceDebugger />
      </body>
    </html>
  );
}
