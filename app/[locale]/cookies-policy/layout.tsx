import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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
    pageKey: 'cookiesPolicy',
    pathname: `/${locale}/cookies-policy`,
  });
}

export default function CookiesPolicyLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
