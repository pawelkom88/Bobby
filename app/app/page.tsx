'use client';

import Link from 'next/link';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Image from 'next/image';
import CartoonButton from '@/components/CartoonButton';
import { ViewTransition } from 'react';
import AnimatedImageWrapper from '@/components/AnimatedImageWrapper';

export default function AppPage() {
  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <main className="app-page" role="main">
            <div className="welcome-container">
              <div className="welcome-card">
                <div>
                  <h1 className="welcome-title">WELCOME</h1>
                  <p className="welcome-subtitle">Hi, I am Bobby, your guide</p></div>
                <AnimatedImageWrapper src="/bobby.png" alt="Bobby" width={300} height={300} className="welcome-image" />
                <CartoonButton containerClassName="welcome-button" asLink href="/your-age">CALL BOBBY</CartoonButton>
                <div className="badges-section">
                  <h2 className="badges-title">YOUR BADGES</h2>
                  <div className="badges-container">
                    <BadgeDisplay showAll={false} />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}
