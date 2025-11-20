'use client';

import { ViewTransition } from 'react';
import VoiceConversation from '@/components/VoiceConversation';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { assessWithGemini } from '@/lib/assessment';
import { logger } from '@/lib/logger';
import type { ConversationMessage, AgeTier, Service } from '@/types';

// Default values for ageTier and situation
const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

export default function ConversationPage() {
  const handleConversationComplete = async (conversation: ConversationMessage[]) => {
    try {
      // Assess the conversation using Gemini
      const assessment = await assessWithGemini(conversation, {
        ageTier: DEFAULT_AGE_TIER,
        situation: DEFAULT_SITUATION,
      });

      // Store assessment in sessionStorage for the completion page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lastAssessment', JSON.stringify({
          assessment,
          passed: assessment.passed,
        }));
      }

      logger.info('Assessment complete', { score: assessment.score, passed: assessment.passed });

      // Navigate to completion
      window.location.href = '/app/completion';
    } catch (error) {
      logger.error('Error assessing conversation', error);
      // Still navigate to completion even if assessment fails
      window.location.href = '/app/completion';
    }
  };

  const handleBack = () => {
    window.location.href = '/app/dial';
  };

  return (
    <ViewTransition>
    <PageWrapper>
      <ErrorBoundary>
        <main className="app-page" role="main">
          <VoiceConversation
            ageTier={DEFAULT_AGE_TIER}
            situation={DEFAULT_SITUATION}
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

