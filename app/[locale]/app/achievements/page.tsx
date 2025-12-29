'use client';

import { Suspense } from 'react';
import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import PageWrapper from '@/components/PageWrapper';
import TrainingHistorySection from '@/components/TrainingHistorySection';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AchievementsPage() {
  const t = useTranslations('achievements');
  return (
    <ViewTransition>
      <Suspense fallback={<LoadingSpinner />}>
        <PageWrapper>
          <main className="achievements-page" role="main">
            <header className="achievements-header">
              <h1 className="achievements-title">{t('title')}</h1>
            </header>
            <div className="achievements-content">
              <section
                className="achievements-section"
                aria-labelledby="score-heading"
              >
                <h2 id="score-heading">{t('score')}</h2>
                <div className="achievements-card">
                  <LevelProgress showLabel={false} />
                </div>
              </section>

              <section
                className="achievements-section"
                aria-labelledby="badges-heading"
              >
                <h2 id="badges-heading">{t('badges')}</h2>
                <div className="achievements-card">
                  <BadgeDisplay showAll={false} />
                </div>
              </section>

              <section
                className="achievements-section"
                aria-labelledby="history-heading"
              >
                <h2 id="history-heading">{t('history')}</h2>
                <div className="achievements-card">
                  <TrainingHistorySection />
                </div>
              </section>
            </div>
          </main>
        </PageWrapper>
      </Suspense>
    </ViewTransition>
  );
}
