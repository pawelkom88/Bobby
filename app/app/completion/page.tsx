'use client';

import { useEffect, useState } from 'react';
import { ViewTransition } from 'react';
import { useRouter } from 'next/navigation';
import CompletionScreen from '@/components/CompletionScreen';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSecureSession } from '@/hooks/useSecureSession';
import type { PerformanceMetrics, AgeTier, Service } from '@/types';
import { useUserData } from '@/context/UserDataContext';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';

const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

function CompletionPageContent() {
  const { getJourneyState } = useUserData();
  const { getSession } = useSecureSession();
  const { user } = useAuth();
  const router = useRouter();
  const [performance, setPerformance] = useState<PerformanceMetrics>({});
  const [selectedAgeTier, setSelectedAgeTier] =
    useState<AgeTier>(DEFAULT_AGE_TIER);
  const [selectedSituation, setSelectedSituation] =
    useState<Service>(DEFAULT_SITUATION);
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Get selected values from journey state
    const journeyState = getJourneyState();
    const ageTier = journeyState?.selectedAgeTier ?? DEFAULT_AGE_TIER;
    const situation = journeyState?.selectedService ?? DEFAULT_SITUATION;
    setSelectedAgeTier(ageTier);
    setSelectedSituation(situation);
  }, [getJourneyState]);

  useEffect(() => {
    // Retrieve assessment from secure server-side session
    const loadAssessment = async () => {
      // Wait for user authentication to resolve
      if (!user) {
        logger.log('🔍 User not authenticated yet, waiting...');
        return;
      }

      const sessionData = await getSession();

      logger.log('🔍 ===== COMPLETION PAGE LOAD =====');
      logger.log('🔍 sessionData:', sessionData);
      logger.log('🔍 completionId:', sessionData?.completionId);
      logger.log('🔍 processedId:', sessionData?.processedCompletionId);

      // Check if session has expired (24-hour limit)
      if (sessionData?.expiresAt && Date.now() > sessionData.expiresAt) {
        logger.log('🔍 Session expired, redirecting to dial');
        router.replace(ROUTES.DIAL);
        return;
      }

      // CRITICAL: Validate that session belongs to the authenticated user
      if (sessionData?.userId && user && sessionData.userId !== user.uid) {
        logger.warn('🔍 Session userId mismatch, redirecting to dial', {
          sessionUserId: sessionData.userId,
          currentUserId: user.uid,
        });
        router.replace(ROUTES.DIAL);
        return;
      }

      // Check if conversation was completed
      if (!sessionData?.conversationComplete) {
        logger.log('🔍 No completed conversation found, redirecting to dial');
        router.replace(ROUTES.DIAL);
        return;
      }

      // Set session as valid
      setIsSessionValid(true);

      if (sessionData?.lastAssessment) {
        try {
          const data = sessionData.lastAssessment;
          logger.log('🔍 Parsed assessment data:', data);
          logger.log('🔍 Assessment object:', data.assessment);
          logger.log('🔍 Assessment score:', data.assessment?.score);

          setPerformance({
            completed: data.passed,
            assessment: data.assessment,
            feedbackSummary: data.assessment.improvements.length
              ? data.assessment.improvements
              : data.assessment.positives,
          });

          logger.log(
            '🔍 Performance state set with assessment:',
            data.assessment
          );

          // Only clear assessment data if this completion has been processed
          // This allows the data to persist for display on refresh
          // but prevents duplicate XP awards
          if (
            sessionData.completionId &&
            sessionData.completionId === sessionData.processedCompletionId
          ) {
            // Already processed, keep data for display but don't award XP again
            logger.log(
              'Completion already processed, showing existing results'
            );
          }
        } catch (error) {
          logger.error('Error parsing assessment data:', error);
          logger.error('🔍 ❌ Error parsing assessment:', error);
        }
      } else {
        logger.log('🔍 ⚠️ No assessment data found in secure session');
      }
    };

    loadAssessment();
  }, [getSession, router, user]);

  // Show loading while checking session
  if (isSessionValid === null) {
    return (
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div>Loading...</div>
              </div>
            </main>
          </ErrorBoundary>
        </PageWrapper>
      </ViewTransition>
    );
  }

  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <main className="app-page" role="main">
            <CompletionScreen
              service={selectedSituation}
              ageTier={selectedAgeTier}
              performance={performance}
            />
          </main>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}

export default function CompletionPage() {
  return <CompletionPageContent />;
}
