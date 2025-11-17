'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CompletionScreen from '@/components/CompletionScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { PerformanceMetrics, AgeTier, Service } from '@/types';

const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

export default function CompletionPage() {
  const [performance, setPerformance] = useState<PerformanceMetrics>({});

  useEffect(() => {
    // Retrieve assessment from sessionStorage
    if (typeof window !== 'undefined') {
      const assessmentData = sessionStorage.getItem('lastAssessment');
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
          // Clear the data after reading
          sessionStorage.removeItem('lastAssessment');
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
    <ErrorBoundary>
      <main className="app-page" role="main">
        <CompletionScreen
          service={DEFAULT_SITUATION}
          ageTier={DEFAULT_AGE_TIER}
          performance={performance}
          onContinue={handleContinue}
          onViewAchievements={handleContinue}
        />
      </main>
    </ErrorBoundary>
  );
}

