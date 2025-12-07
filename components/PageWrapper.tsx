'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import { ROUTES } from '@/lib/routes';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();

  const showBottomNav =
    pathname !== ROUTES.HOME &&
    pathname !== ROUTES.DIAL &&
    pathname !== ROUTES.CONVERSATION;

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
