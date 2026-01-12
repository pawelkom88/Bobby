import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import HomePageClient from './HomePageClient';
import { BASE_URL, getAbsoluteUrl } from '@/lib/site';
import type { ReactNode } from 'react';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'metadata.pages.home',
  });
  const title = t('title');
  const description = t('description');

  return {
    title,
    description,
    alternates: {
      canonical: getAbsoluteUrl(`/${locale}`),
    },
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function HomePage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'metadata',
  });
  const nonce = (await headers()).get('x-csp-nonce') ?? undefined;
  const siteUrl = BASE_URL.replace(/\/$/, '');

  return (
    <>
      {nonce ? (
        <script
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
              url: siteUrl,
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
      <HomePageClient />
    </>
  );
}
