'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import { ROUTES } from '@/lib/routes';
import { useLocale } from 'next-intl';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();
  const locale = useLocale();

  const showBottomNav =
    pathname !== `/${locale}` &&
    pathname !== `/${locale}${ROUTES.HOME}` &&
    pathname !== `/${locale}${ROUTES.DIAL}` &&
    pathname !== `/${locale}${ROUTES.CONVERSATION}` &&
    pathname !== `/${locale}${ROUTES.COMPLETION}` &&
    !pathname.includes('/parent-guide') &&
    !pathname.includes('/faq') &&
    !pathname.includes('/pytania') &&
    !pathname.includes('/contact') &&
    !pathname.includes('/kontakt') &&
    !pathname.includes('/privacy-policy') &&
    !pathname.includes('/terms-conditions') &&
    !pathname.includes('/cookies-policy') &&
    !pathname.includes('/safety-privacy') &&
    !pathname.includes('/beta-feedback');

  return (
    <div
      className="page-wrapper"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: showBottomNav ? '75px' : '0',
        }}
      >
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
