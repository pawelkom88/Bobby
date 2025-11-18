'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();
  
  // Hide bottom nav on root route and /app/dial
  const showBottomNav = pathname !== '/' && pathname !== '/app/dial';

  return (
    <div className="page-wrapper" style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

