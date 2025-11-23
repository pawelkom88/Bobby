'use client';

import { useEffect, useState } from 'react';
import { ViewTransition } from 'react';
import VoiceConversation from '@/components/VoiceConversation';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getSelectedService, getSelectedAgeTier } from '@/lib/storage';
import { AgeTier, ConversationMessage, Service } from '@/types';
import { assessWithGemini } from '@/lib/assessment';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';

// Default values for ageTier and situation
const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

export default function ConversationPage() {
  const [isComplete, setIsComplete] = useState(false);

  // Get selected values from storage
  const selectedAgeTier = getSelectedAgeTier() ?? DEFAULT_AGE_TIER;
  const selectedSituation = getSelectedService() ?? DEFAULT_SITUATION;

  // Check if user is trying to return to a completed conversation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const conversationComplete = sessionStorage.getItem(
        'conversationComplete'
      );
      if (conversationComplete === 'true') {
        setIsComplete(true);
        // Clear the flag and redirect after a brief moment to show message
        setTimeout(() => {
          sessionStorage.removeItem('conversationComplete');
          window.location.href = ROUTES.APP;
        }, 2000);
      }
    }
  }, []);

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
    conversation: ConversationMessage[]
  ) => {
    try {
      // Assess the conversation using Gemini
      const assessment = await assessWithGemini(conversation, {
        ageTier: selectedAgeTier,
        situation: selectedSituation,
      });

      // Store assessment in sessionStorage for the completion page
      // Generate unique completion ID to prevent duplicate XP awards
      if (typeof window !== 'undefined') {
        const completionId = `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(
          'lastAssessment',
          JSON.stringify({
            assessment,
            passed: assessment.passed,
          })
        );
        sessionStorage.setItem('completionId', completionId);
      }

      logger.info('Assessment complete', {
        score: assessment.score,
        passed: assessment.passed,
      });

      // Mark conversation as complete to prevent back navigation
      sessionStorage.setItem('conversationComplete', 'true');

      // Navigate to completion
      window.location.href = ROUTES.COMPLETION;
    } catch (error) {
      logger.error('Error assessing conversation', error);
      // Still navigate to completion even if assessment fails
      window.location.href = ROUTES.COMPLETION;
    }
  };

  const handleBack = () => {
    window.location.href = ROUTES.DIAL;
  };

  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <main className="app-page" role="main">
            <VoiceConversation
              ageTier={selectedAgeTier}
              situation={selectedSituation}
              onComplete={handleConversationComplete}
              onBack={handleBack}
              autoStart={true}
            />
          </main>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}
