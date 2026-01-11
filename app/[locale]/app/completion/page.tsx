'use client';

import { useEffect, useState } from 'react';
import { ViewTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import CompletionScreen from '@/components/CompletionScreen';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QueryBoundary } from '@/components/QueryBoundary';
import { useSession } from '@/hooks/queries/useSession';
import type { PerformanceMetrics, AgeTier, Service } from '@/types';
import { useUserData } from '@/context/UserDataContext';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';
import LoadingSpinner from '@/components/LoadingSpinner';

const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

function CompletionPageContent() {
  const { getJourneyState } = useUserData();
  const {
    data: sessionData,
    isLoading: sessionLoading,
    error: sessionError,
  } = useSession();
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('completion');
  const [performance, setPerformance] = useState<PerformanceMetrics>({});
  const [selectedAgeTier, setSelectedAgeTier] =
    useState<AgeTier>(DEFAULT_AGE_TIER);
  const [selectedSituation, setSelectedSituation] =
    useState<Service>(DEFAULT_SITUATION);
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const journeyState = getJourneyState();
    const ageTier = journeyState?.selectedAgeTier ?? DEFAULT_AGE_TIER;
    const situation = journeyState?.selectedService ?? DEFAULT_SITUATION;
    setSelectedAgeTier(ageTier);
    setSelectedSituation(situation);
  }, [getJourneyState]);

  useEffect(() => {
    const loadAssessment = () => {
      if (!user) {
        logger.log('🔍 User not authenticated yet, waiting...');
        return;
      }

      if (sessionLoading) {
        logger.log('🔍 Session still loading, waiting...');
        return;
      }

      if (sessionError) {
        logger.error(
          '🔍 Failed to load session data, redirecting to dial',
          sessionError
        );
        router.replace(ROUTES.DIAL);
        return;
      }

      logger.log('🔍 ===== COMPLETION PAGE LOAD =====');
      logger.log('🔍 sessionData:', sessionData);
      logger.log('🔍 completionId:', sessionData?.completionId);
      logger.log('🔍 processedId:', sessionData?.processedCompletionId);

      if (sessionData?.expiresAt) {
        const expiresAtMs =
          typeof sessionData.expiresAt === 'number'
            ? sessionData.expiresAt
            : new Date(sessionData.expiresAt).getTime();

        if (Number.isFinite(expiresAtMs) && Date.now() > expiresAtMs) {
          logger.log('🔍 Session expired, redirecting to dial');
          router.replace(ROUTES.DIAL);
          return;
        }
      }

      if (sessionData?.userId && user && sessionData.userId !== user.uid) {
        logger.warn('🔍 Session userId mismatch, redirecting to dial', {
          sessionUserId: sessionData.userId,
          currentUserId: user.uid,
        });
        router.replace(ROUTES.DIAL);
        return;
      }

      if (!sessionData?.conversationComplete) {
        logger.log('🔍 No completed conversation found, redirecting to dial');
        router.replace(ROUTES.DIAL);
        return;
      }

      // todo Paw: can we derive this state somehow ?
      setIsSessionValid(true);

      // Capture conversation ID if available
      if (sessionData?.conversationId) {
        setConversationId(sessionData.conversationId);
      }

      if (sessionData?.lastAssessment) {
        try {
          const data = sessionData.lastAssessment;
          logger.log('🔍 Parsed assessment data:', data);
          logger.log('🔍 Assessment object:', data.assessment);
          logger.log('🔍 Assessment score:', data.assessment?.score);

          setPerformance({
            completed: data.assessment.passed,
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
  }, [router, sessionData, sessionError, sessionLoading, user]);

  if (isSessionValid === null) {
    return (
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <LoadingSpinner text={t('loading')} heading={t('loadingData')} />
          </ErrorBoundary>
        </PageWrapper>
      </ViewTransition>
    );
  }

  return (
    <QueryBoundary
      loadingFallback={
        <LoadingSpinner text={t('loadingData')} heading={t('loading')} />
      }
      errorFallback={({ error, resetErrorBoundary }) => (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {t('error.title')}
          </h2>
          <p className="mb-4 text-gray-600">{error.message}</p>
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            {t('error.retry')}
          </button>
        </div>
      )}
    >
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main">
              <CompletionScreen
                service={selectedSituation}
                ageTier={selectedAgeTier}
                performance={performance}
                conversationId={conversationId}
              />
            </main>
          </ErrorBoundary>
        </PageWrapper>
      </ViewTransition>
    </QueryBoundary>
  );
}

export default function CompletionPage() {
  return <CompletionPageContent />;
}
