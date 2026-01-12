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
    pageKey: 'parentGuide',
    pathname: `/${locale}/parent-guide`,
  });
}

export default function ParentGuideLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
