'use client';

import Link from 'next/link';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AppPage() {
  const progress = null;

  return (
    <ErrorBoundary>
      <main className="app-page" role="main">
        <div className="welcome-screen">
          <h1 className="welcome-title">Welcome back!</h1>
          
          <div className="welcome-progress">
            <LevelProgress showLabel={true} />
          </div>

          <div className="welcome-badges">
            <h2>Your Badges</h2>
            <BadgeDisplay showAll={false} />
          </div>

          <Link
            href="/app/dial"
            className="call-bobby-button"
            aria-label="Start training with Bobby"
          >
            Call Bobby
          </Link>
        </div>
      </main>
    </ErrorBoundary>
  );
}
