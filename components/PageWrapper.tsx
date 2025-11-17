'use client';

import React from 'react';
import BottomNav from './BottomNav';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
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
      <BottomNav />
    </div>
  );
}

