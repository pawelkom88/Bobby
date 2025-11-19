'use client';

import { ViewTransition } from 'react';
import Link from 'next/link';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function HomePage() {
  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <main className="home-page" role="main">
            <header className="home-header">
              <h1 className="home-title">Welcome!</h1>
              <p className="home-subtitle">Landing page here</p>
            </header>
          </main>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}

