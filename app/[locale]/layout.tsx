import type { Metadata } from 'next';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { OptimizedProviders } from '@/components/OptimizedProviders';
import { routing } from '@/i18n/routing';
import { locales, type Locale } from '@/i18n/locales';

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
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || 'https://bobby-app.com'
    ),
    title,
    description,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bobby-app.com'}/${locale}`,
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

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Nunito&display=swap"
          rel="stylesheet"
        />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: t('title'),
              description: t('description'),
              applicationCategory: 'EducationalApplication',
              operatingSystem: t('structuredData.operatingSystem'),
              url: process.env.NEXT_PUBLIC_BASE_URL || 'https://bobby-app.com',
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
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <OptimizedProviders>{children}</OptimizedProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
