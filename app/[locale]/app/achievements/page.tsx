'use client';

import { Suspense } from 'react';
import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import PageWrapper from '@/components/PageWrapper';
import TrainingHistorySection from '@/components/TrainingHistorySection';
import LoadingSpinner from '@/components/LoadingSpinner';
import { SpeculationRules } from '@/components/SpeculationRules';
import { ROUTES } from '@/lib/routes';
import styles from './Achievements.module.css';

function AchievementsPageContent() {
  const t = useTranslations('achievements');
  return (
    <ViewTransition>
      <Suspense fallback={<LoadingSpinner />}>
        <PageWrapper>
          <main className={styles.page} role="main">
            <header className={styles.header}>
              <h1 className={styles.title}>{t('title')}</h1>
            </header>
            <div className={styles.content}>
              <section className={styles.section} aria-labelledby="score-heading">
                <h2 id="score-heading" className={styles.sectionTitle}>
                  {t('score')}
                </h2>
                <div className={styles.card}>
                  <LevelProgress showLabel={false} />
                </div>
              </section>

              <section className={styles.section} aria-labelledby="badges-heading">
                <h2 id="badges-heading" className={styles.sectionTitle}>
                  {t('badges')}
                </h2>
                <div className={styles.card}>
                  <BadgeDisplay showAll={false} />
                </div>
              </section>

              <section className={styles.section} aria-labelledby="history-heading">
                <h2 id="history-heading" className={styles.sectionTitle}>
                  {t('history')}
                </h2>
                <div className={styles.card}>
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

export default function AchievementsPage() {
  return (
    <>
      <AchievementsPageContent />
      <SpeculationRules prefetchPaths={[ROUTES.APP, ROUTES.CHATS, ROUTES.SETTINGS]} eagerness="moderate" />
    </>
  );
}
