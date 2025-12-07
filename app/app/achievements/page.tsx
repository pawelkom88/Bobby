'use client';

import { ViewTransition } from 'react';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import PageWrapper from '@/components/PageWrapper';
import TrainingHistorySection from '@/components/TrainingHistorySection';

export default function AchievementsPage() {
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
                <TrainingHistorySection />
              </div>
            </section>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}
