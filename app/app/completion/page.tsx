'use client';

import { useEffect, useState } from 'react';
import { ViewTransition } from 'react';
import CompletionScreen from '@/components/CompletionScreen';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { PerformanceMetrics, AgeTier, Service } from '@/types';
import { getSelectedService, getSelectedAgeTier } from '@/lib/storage';

const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

export default function CompletionPage() {
  const [performance, setPerformance] = useState<PerformanceMetrics>({});

  // Get selected values from storage
  const selectedAgeTier = getSelectedAgeTier() ?? DEFAULT_AGE_TIER;
  const selectedSituation = getSelectedService() ?? DEFAULT_SITUATION;

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
            console.log('Completion already processed, showing existing results');
          }
        } catch (error) {
          console.error('Error parsing assessment data:', error);
        }
      }
    }
  }, []);

  const handleContinue = () => {
    // Navigate back to welcome
    window.location.href = '/app';
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

