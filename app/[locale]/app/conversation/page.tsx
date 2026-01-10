'use client';

import { useEffect, useState, startTransition, useRef } from 'react';
import { ViewTransition } from 'react';
import { Activity } from 'react';
import { useRouter } from 'next/navigation';
import CreditDeductionIntegration from '@/components/CreditDeductionIntegration';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PaidRouteGuard from '@/components/PaidRouteGuard';
import { useUserData } from '@/context/UserDataContext';
import { useCredits } from '@/context/CreditsContext';
import { useSession } from '@/hooks/queries/useSession';
import {
  useClearSession,
  useSetAssessment,
  useSetConversationId,
} from '@/hooks/mutations/useSessionMutations';
import { AgeTier, ConversationMessage, Service } from '@/types';
import { assessWithGemini } from '@/lib/assessment';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';

// Default values for ageTier and situation
const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

function ConversationPageContent() {
  logger.log('ConversationPageContent: Component mounted/rendered');

  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);
  const [isProcessingAssessment, setIsProcessingAssessment] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getJourneyState } = useUserData();
  const { setConversationActive } = useCredits();
  const { data: sessionData } = useSession();
  const clearSession = useClearSession();
  const setAssessment = useSetAssessment();
  const setConversationId = useSetConversationId();

  // Get selected values from journey state
  const journeyState = getJourneyState();
  const selectedAgeTier = journeyState?.selectedAgeTier ?? DEFAULT_AGE_TIER;
  const selectedSituation = journeyState?.selectedService ?? DEFAULT_SITUATION;

  // Check if user is trying to return to a completed conversation
  useEffect(() => {
    const checkConversationStatus = () => {
      // Only redirect if conversation is complete AND assessment is already stored
      // This allows the completion flow to work properly
      if (sessionData?.conversationComplete && sessionData?.lastAssessment) {
        setIsComplete(true);
        // Clear the flag and redirect after a brief moment to show message
        // Store timeout ref so we can cancel on unmount
        redirectTimeoutRef.current = setTimeout(async () => {
          await clearSession.mutateAsync();
          startTransition(() => {
            router.push(ROUTES.APP);
          });
        }, 2000);
      }
    };

    checkConversationStatus();

    // Cleanup: cancel timeout if component unmounts
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [sessionData, clearSession, router]);

  // Set conversation as active when component mounts
  useEffect(() => {
    logger.log('ConversationPage: Setting conversation as active');
    setConversationActive(true);

    // Cleanup: clear conversation active when unmounting or navigating away
    return () => {
      logger.log('ConversationPage: Clearing conversation active');
      setConversationActive(false);
    };
  }, [setConversationActive]);

  // Show message if trying to return to completed conversation
  if (isComplete) {
    return (
      <ViewTransition>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main">
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h1>Conversation Complete</h1>
                <p>Your emergency call practice has finished.</p>
                <p>Redirecting you to start a new practice...</p>
              </div>
            </main>
          </ErrorBoundary>
        </PageWrapper>
      </ViewTransition>
    );
  }
  const handleConversationComplete = async (
    conversation: ConversationMessage[],
    conversationId: string
  ) => {
    setIsProcessingAssessment(true);
    try {
      // DEBUG: Log conversation details
      logger.log('🔍 CONVERSATION COMPLETE - Full conversation:', conversation);
      logger.log('🔍 Total messages:', conversation.length);
      logger.log(
        '🔍 User messages:',
        conversation.filter(m => m.type === 'user').length
      );
      logger.log(
        '🔍 Agent messages:',
        conversation.filter(m => m.type === 'agent').length
      );
      logger.log(
        '🔍 User message texts:',
        conversation.filter(m => m.type === 'user').map(m => m.text)
      );

      // Assess the conversation using Gemini
      const assessment = await assessWithGemini(conversation, {
        ageTier: selectedAgeTier,
        situation: selectedSituation,
      });

      // DEBUG: Log assessment results
      logger.log('🔍 ASSESSMENT RESULTS:', assessment);
      logger.log('🔍 Score:', assessment.score);
      logger.log('🔍 User turns:', assessment.metrics.userTurns);
      logger.log('🔍 Duration:', assessment.metrics.durationSeconds);

      // Store assessment in secure server-side session
      // Generate unique completion ID to prevent duplicate XP awards
      const completionId = `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const stored = await setAssessment.mutateAsync({
        assessment: {
          assessment: {
            score: assessment.score,
            passed: assessment.passed,
            positives: assessment.positives,
            improvements: assessment.improvements,
            warnings: assessment.warnings,
            metrics: assessment.metrics,
          },
          passed: assessment.passed,
        },
        completionId,
      });

      // Store the actual Firestore conversation ID for linking to chat history
      if (conversationId) {
        await setConversationId.mutateAsync(conversationId);
        logger.log('Stored conversationId in session:', conversationId);
      }

      if (!stored) {
        logger.error('Failed to store assessment in secure session');
      }

      logger.info('Assessment complete', {
        score: assessment.score,
        passed: assessment.passed,
      });

      // Navigate to completion
      startTransition(() => {
        router.push(ROUTES.COMPLETION);
      });
    } catch (error) {
      logger.error('Error assessing conversation', error);
      // Still navigate to completion even if assessment fails
      startTransition(() => {
        router.push(ROUTES.COMPLETION);
      });
    } finally {
      setIsProcessingAssessment(false);
    }
  };

  const handleBack = () => {
    startTransition(() => {
      router.push(ROUTES.DIAL);
    });
  };

  return (
    <ViewTransition>
      <Activity mode={isProcessingAssessment ? 'hidden' : 'visible'}>
        <PageWrapper>
          <ErrorBoundary>
            <main className="app-page" role="main">
              <CreditDeductionIntegration
                ageTier={selectedAgeTier}
                situation={selectedSituation}
                onComplete={handleConversationComplete}
                onBack={handleBack}
                autoStart={true}
              />
            </main>
          </ErrorBoundary>
        </PageWrapper>
      </Activity>
    </ViewTransition>
  );
}

export default function ConversationPage() {
  logger.log('ConversationPage: Export function called');
  return (
    <PaidRouteGuard>
      <ConversationPageContent />
    </PaidRouteGuard>
  );
}
