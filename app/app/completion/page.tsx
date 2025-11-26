'use client';

import { useEffect, useState } from 'react';
import { ViewTransition } from 'react';
import CompletionScreen from '@/components/CompletionScreen';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { PerformanceMetrics, AgeTier, Service } from '@/types';
import { useUserData } from '@/context/UserDataContext';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';

const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

export default function CompletionPage() {
  const { getJourneyState } = useUserData();
  const [performance, setPerformance] = useState<PerformanceMetrics>({});
  const [selectedAgeTier, setSelectedAgeTier] = useState<AgeTier>(DEFAULT_AGE_TIER);
  const [selectedSituation, setSelectedSituation] = useState<Service>(DEFAULT_SITUATION);

  useEffect(() => {
    // Get selected values from journey state
    const journeyState = getJourneyState();
    const ageTier = journeyState?.selectedAgeTier ?? DEFAULT_AGE_TIER;
    const situation = journeyState?.selectedService ?? DEFAULT_SITUATION;
    setSelectedAgeTier(ageTier);
    setSelectedSituation(situation);
  }, [getJourneyState]);

  useEffect(() => {
    // Retrieve assessment from sessionStorage
    if (typeof window !== 'undefined') {
      const assessmentData = sessionStorage.getItem('lastAssessment');
      const completionId = sessionStorage.getItem('completionId');
      const processedId = sessionStorage.getItem('processedCompletionId');

      console.log('🔍 ===== COMPLETION PAGE LOAD =====');
      console.log('🔍 assessmentData from sessionStorage:', assessmentData);
      console.log('🔍 completionId:', completionId);
      console.log('🔍 processedId:', processedId);

      if (assessmentData) {
        try {
          const data = JSON.parse(assessmentData);
          console.log('🔍 Parsed assessment data:', data);
          console.log('🔍 Assessment object:', data.assessment);
          console.log('🔍 Assessment score:', data.assessment?.score);

          setPerformance({
            completed: data.passed,
            assessment: data.assessment,
            feedbackSummary: data.assessment.improvements.length
              ? data.assessment.improvements
              : data.assessment.positives,
          });

          console.log('🔍 Performance state set with assessment:', data.assessment);

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
          console.error('🔍 ❌ Error parsing assessment:', error);
        }
      } else {
        console.log('🔍 ⚠️ No assessment data found in sessionStorage');
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
