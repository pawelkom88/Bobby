'use client';

import { useEffect, useState } from 'react';
import { ViewTransition } from 'react';
import CompletionScreen from '@/components/CompletionScreen';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { PerformanceMetrics, AgeTier, Service } from '@/types';
import { getSelectedService, getSelectedAgeTier } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';

const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

export default function CompletionPage() {
  const [performance, setPerformance] = useState<PerformanceMetrics>({});
  const [selectedAgeTier, setSelectedAgeTier] = useState<AgeTier>(DEFAULT_AGE_TIER);
  const [selectedSituation, setSelectedSituation] = useState<Service>(DEFAULT_SITUATION);

  useEffect(() => {
    // Get selected values from storage on client-side only
    const ageTier = getSelectedAgeTier() ?? DEFAULT_AGE_TIER;
    const situation = getSelectedService() ?? DEFAULT_SITUATION;
    setSelectedAgeTier(ageTier);
    setSelectedSituation(situation);
  }, []);

  useEffect(() => {
    // Retrieve assessment from sessionStorage
    if (typeof window !== 'undefined') {
      const assessmentData = sessionStorage.getItem('lastAssessment');
      const completionId = sessionStorage.getItem('completionId');
      const processedId = sessionStorage.getItem('processedCompletionId');

      if (assessmentData) {
        try {
          const data = JSON.parse(assessmentData);
          setPerformance({
            completed: data.passed,
            assessment: data.assessment,
            feedbackSummary: data.assessment.improvements.length
              ? data.assessment.improvements
              : data.assessment.positives,
          });

          // Only clear assessment data if this completion has been processed
          // This allows the data to persist for display on refresh
          // but prevents duplicate XP awards
          if (completionId && completionId === processedId) {
            // Already processed, keep data for display but don't award XP again
            logger.log(
              'Completion already processed, showing existing results'
            );
          }
        } catch (error) {
          logger.error('Error parsing assessment data:', error);
        }
      }
    }
  }, []);

  const handleContinue = () => {
    // Navigate back to welcome
    window.location.href = ROUTES.APP;
  };

  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <main className="app-page" role="main">
            <CompletionScreen
              service={selectedSituation}
              ageTier={selectedAgeTier}
              performance={performance}
              onContinue={handleContinue}
              onViewAchievements={handleContinue}
            />
          </main>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}
