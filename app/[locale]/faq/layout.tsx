import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { getPageMetadata } from '@/lib/seo';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return getPageMetadata({
    locale,
    pageKey: 'faq',
    pathname: `/${locale}/faq`,
  });
}

export default async function FaqLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const tLanding = await getTranslations({
    locale,
    namespace: 'landing',
  });
  const faqItems = tLanding.raw('faq.items') as Record<
    string,
    { question: string; answer: string }
  >;
  const mainEntity = Object.values(faqItems).map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  }));
  const nonce = (await headers()).get('x-csp-nonce') ?? undefined;

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
              '@type': 'FAQPage',
              mainEntity,
            }),
          }}
        />
      ) : null}
      {children}
    </>
  );
}
