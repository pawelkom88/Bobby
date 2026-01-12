import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAbsoluteUrl } from '@/lib/site';

type PageMetadataArgs = {
  locale: string;
  pageKey: string;
  pathname: string;
};

export async function getPageMetadata({
  locale,
  pageKey,
  pathname,
}: PageMetadataArgs): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: `metadata.pages.${pageKey}`,
  });
  const title = t('title');
  const description = t('description');

  return {
    title,
    description,
    alternates: {
      canonical: getAbsoluteUrl(pathname),
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
