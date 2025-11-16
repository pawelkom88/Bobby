'use client';

import Link from 'next/link';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';

export default function HomePage() {
  return (
    <main className="home-page" role="main">
      <header className="home-header">
        <h1 className="home-title">Welcome!</h1>
        <p className="home-subtitle">Hi, I'm Bobby, your helper!</p>
      </header>

      <div className="home-character">
        {/* Placeholder for Bobby character illustration */}
        <div className="bobby-character" aria-hidden="true">
          👤
        </div>
      </div>

      <div className="home-progress">
        <LevelProgress showLabel={true} />
      </div>

      <div className="home-actions">
        <Link
          href="/app"
          className="call-bobby-button"
          aria-label="Start training with Bobby"
        >
          Call Bobby
        </Link>
        <Link
          href="/achievements"
          className="achievements-button"
          aria-label="View your achievements"
        >
          My Achievements
        </Link>
      </div>

      <nav className="home-navigation" role="navigation" aria-label="Main navigation">
        <Link href="/" className="nav-link" aria-current="page">
          Home
        </Link>
        <Link href="/app" className="nav-link">
          Scenarios
        </Link>
        <Link href="/settings" className="nav-link">
          Settings
        </Link>
      </nav>
    </main>
  );
}

