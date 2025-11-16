'use client';

import Link from 'next/link';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import { getUserProgress } from '@/lib/storage';

export default function AchievementsPage() {
  const progress = getUserProgress();

  return (
    <main className="achievements-page" role="main">
      <header className="achievements-header">
        <h1 className="achievements-title">MY ACHIEVEMENTS</h1>
      </header>

      <div className="achievements-progress">
        <div className="progress-section">
          <h2>Your Score</h2>
          <LevelProgress showLabel={true} />
        </div>
      </div>

      <div className="achievements-badges">
        <h2>Your Badges</h2>
        <BadgeDisplay showAll={true} />
      </div>

      <div className="achievements-history">
        <h2>Training History</h2>
        {progress.conversations.length === 0 ? (
          <p className="no-history">No training sessions yet. Start your first scenario!</p>
        ) : (
          <ul className="conversation-list" role="list">
            {progress.conversations
              .slice()
              .reverse()
              .slice(0, 10)
              .map((conv, index) => (
                <li key={index} className="conversation-item" role="listitem">
                  <div className="conversation-service">{conv.service.toUpperCase()}</div>
                  <div className="conversation-date">
                    {new Date(conv.timestamp).toLocaleDateString()}
                  </div>
                  <div className="conversation-xp">+{conv.xpEarned} XP</div>
                </li>
              ))}
          </ul>
        )}
      </div>

      <nav className="achievements-navigation" role="navigation" aria-label="Main navigation">
        <Link href="/" className="nav-link">
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

