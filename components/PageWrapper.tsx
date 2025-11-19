'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();
  
  // Hide bottom nav on root route, /app/dial, and /app/conversation
  const showBottomNav = pathname !== '/' && pathname !== '/app/dial' && pathname !== '/app/conversation';

  return (
    <div className="page-wrapper" style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

