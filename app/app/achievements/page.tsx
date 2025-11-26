'use client';

import { ViewTransition } from 'react';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import PageWrapper from '@/components/PageWrapper';
import { useUserData } from '@/context/UserDataContext';

export default function AchievementsPage() {
  const { getUserProgress } = useUserData();
  const progress = getUserProgress();

  return (
    <ViewTransition>
      <PageWrapper>
        <main className="achievements-page" role="main">
          <header className="achievements-header">
            <h1 className="achievements-title">MY ACHIEVEMENTS</h1>
          </header>
          <div className="achievements-content">
            <section
              className="achievements-section"
              aria-labelledby="score-heading"
            >
              <h2 id="score-heading">Your Score</h2>
              <div className="achievements-card">
                <LevelProgress showLabel={true} />
              </div>
            </section>

            <section
              className="achievements-section"
              aria-labelledby="badges-heading"
            >
              <h2 id="badges-heading">Your Badges</h2>
              <div className="achievements-card">
                <BadgeDisplay showAll={false} />
              </div>
            </section>

            <section
              className="achievements-section"
              aria-labelledby="history-heading"
            >
              <h2 id="history-heading">Training History</h2>
              <div className="achievements-card">
                {progress.conversations.length === 0 ? (
                  <p className="no-history">
                    No training sessions yet. Start your first scenario!
                  </p>
                ) : (
                  <ul className="conversation-list" role="list">
                    {progress.conversations
                      .slice()
                      .reverse()
                      .slice(0, 10)
                      .map((conv, index) => (
                        <li
                          key={index}
                          className="conversation-item"
                          role="listitem"
                        >
                          <div className="conversation-service">
                            {conv.service.toUpperCase()}
                          </div>
                          <div className="conversation-date">
                            {new Date(conv.timestamp).toLocaleDateString()}
                          </div>
                          <div className="conversation-xp">
                            +{conv.xpEarned} XP
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}
