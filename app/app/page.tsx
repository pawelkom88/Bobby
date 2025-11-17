'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AgeSelector from '@/components/AgeSelector';
import SituationSelector from '@/components/SituationSelector';
import DialPad from '@/components/DialPad';
import VoiceConversation from '@/components/VoiceConversation';
import CompletionScreen from '@/components/CompletionScreen';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import { getUserProgress } from '@/lib/storage';
import { assessConversation } from '@/lib/assessment';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { AgeTierConfig, Situation, PerformanceMetrics, ConversationMessage, AgeTier, Service } from '@/types';

type Step = 'welcome' | 'age_selection' | 'situation_selection' | 'dialing' | 'conversation' | 'completion';

const STEPS: Record<string, Step> = {
  WELCOME: 'welcome',
  AGE_SELECTION: 'age_selection',
  SITUATION_SELECTION: 'situation_selection',
  DIALING: 'dialing',
  CONVERSATION: 'conversation',
  COMPLETION: 'completion',
};

export default function AppPage() {
  type CallSession = {
    step: Step;
    ageTier: AgeTier | null;
    situation: Service | null;
  };

  const [session, setSession, clearSession] = useLocalStorage<CallSession>('bobby-call-session', {
    step: STEPS.WELCOME,
    ageTier: null,
    situation: null,
  });
  const [performance, setPerformance] = useState<PerformanceMetrics>({});

  const progress = getUserProgress();

  const handleCallBobby = () => {
    setSession((prev) => ({ ...prev, step: STEPS.AGE_SELECTION }));
  };

  const handleAgeSelected = (tier: AgeTierConfig) => {
    setSession((prev) => ({
      ...prev,
      ageTier: tier.id,
      step: STEPS.SITUATION_SELECTION,
    }));
  };

  const handleSituationSelected = (situation: Situation) => {
    setSession((prev) => ({
      ...prev,
      situation: situation.id,
      step: STEPS.DIALING,
    }));
  };

  const handleCorrectNumber = () => {
    setSession((prev) => ({ ...prev, step: STEPS.CONVERSATION }));
  };

  const handleConversationComplete = (conversation: ConversationMessage[]) => {
    const assessment = assessConversation(conversation, {
      ageTier: session.ageTier,
      situation: session.situation,
    });

    const perf: PerformanceMetrics = {
      completed: assessment.passed,
      assessment,
      feedbackSummary: assessment.improvements.length
        ? assessment.improvements
        : assessment.positives,
    };

    setPerformance(perf);
    setSession((prev) => ({ ...prev, step: STEPS.COMPLETION }));
  };

  const handleContinue = () => {
    // Reset for new scenario
    setPerformance({});
    clearSession();
  };

  const handleViewAchievements = () => {
    clearSession();
  };

  // Welcome Screen
  if (session.step === STEPS.WELCOME) {
    return (
      <ErrorBoundary>
        <main className="app-page" role="main">
          <div className="welcome-screen">
            <h1 className="welcome-title">Welcome back!</h1>
            
            <div className="welcome-progress">
              <LevelProgress showLabel={true} />
            </div>

            <div className="welcome-badges">
              <h2>Your Badges</h2>
              <BadgeDisplay showAll={false} />
            </div>

            <button
              type="button"
              className="call-bobby-button"
              onClick={handleCallBobby}
              aria-label="Start training with Bobby"
            >
              Call Bobby
            </button>
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  // Age Selection
  if (session.step === STEPS.AGE_SELECTION) {
    return (
      <ErrorBoundary>
        <main className="app-page" role="main">
          <AgeSelector onSelect={handleAgeSelected} selectedTier={session.ageTier} />
        </main>
      </ErrorBoundary>
    );
  }

  // Situation Selection
  if (session.step === STEPS.SITUATION_SELECTION) {
    return (
      <ErrorBoundary>
        <main className="app-page" role="main">
          <SituationSelector onSelect={handleSituationSelected} selectedSituation={session.situation} />
        </main>
      </ErrorBoundary>
    );
  }

  // Number Dialing
  if (session.step === STEPS.DIALING) {
    return (
      <ErrorBoundary>
        <main className="app-page" role="main">
          <DialPad onCorrectNumber={handleCorrectNumber} />
        </main>
      </ErrorBoundary>
    );
  }

  // Voice Conversation
  if (session.step === STEPS.CONVERSATION) {
    return (
      <ErrorBoundary>
        <main className="app-page" role="main">
          <VoiceConversation
            ageTier={session.ageTier ?? undefined}
            situation={session.situation ?? undefined}
            onComplete={handleConversationComplete}
          />
        </main>
      </ErrorBoundary>
    );
  }

  // Completion Screen
  if (session.step === STEPS.COMPLETION) {
    return (
      <ErrorBoundary>
        <main className="app-page" role="main">
          <CompletionScreen
            service={session.situation ?? undefined}
            ageTier={session.ageTier ?? undefined}
            performance={performance}
            onContinue={handleContinue}
            onViewAchievements={handleViewAchievements}
          />
        </main>
      </ErrorBoundary>
    );
  }

  return null;
}

