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
    pageKey: 'safetyPrivacy',
    pathname: `/${locale}/safety-privacy`,
  });
}

export default function SafetyPrivacyLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
