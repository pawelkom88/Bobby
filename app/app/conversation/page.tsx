'use client';

import VoiceConversation from '@/components/VoiceConversation';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { assessConversation } from '@/lib/assessment';
import type { ConversationMessage, AgeTier, Service } from '@/types';

// Default values for ageTier and situation
const DEFAULT_AGE_TIER: AgeTier = 1;
const DEFAULT_SITUATION: Service = 'fire';

export default function ConversationPage() {
  const handleConversationComplete = (conversation: ConversationMessage[]) => {
    // Assess the conversation
    const assessment = assessConversation(conversation, {
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

    // Navigate to completion
    window.location.href = '/app/completion';
  };

  const handleBack = () => {
    window.location.href = '/app/dial';
  };

  return (
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
  );
}

