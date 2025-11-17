'use client';

import { useState, useEffect } from 'react';
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
    fromDialing?: boolean;
  };

  const [session, setSession, clearSession] = useLocalStorage<CallSession>('bobby-call-session', {
    step: STEPS.WELCOME,
    ageTier: null,
    situation: null,
    fromDialing: false,
  });
  const [performance, setPerformance] = useState<PerformanceMetrics>({});

  const progress = getUserProgress();

  // Validate session integrity - reset if incomplete or invalid
  const isSessionValid = (): boolean => {
    // If in conversation or completion, must have both ageTier and situation
    if (session.step === STEPS.CONVERSATION || session.step === STEPS.COMPLETION) {
      return session.ageTier !== null && session.situation !== null;
    }
    // For other steps, validation is more lenient
    return true;
  };

  // Reset to welcome if session is invalid
  useEffect(() => {
    if (!isSessionValid()) {
      setSession((prev) => ({
        ...prev,
        step: STEPS.WELCOME,
        ageTier: null,
        situation: null,
        fromDialing: false,
      }));
    }
  }, [session.step, session.ageTier, session.situation]);

  const handleCallBobby = () => {
    setSession((prev) => ({
      ...prev,
      step: STEPS.AGE_SELECTION,
      ageTier: null,
      situation: null,
      fromDialing: false,
    }));
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
    setSession((prev) => ({ ...prev, step: STEPS.CONVERSATION, fromDialing: true }));
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
    setSession((prev) => ({
      ...prev,
      step: STEPS.WELCOME,
      ageTier: null,
      situation: null,
      fromDialing: false,
    }));
  };

  const handleViewAchievements = () => {
    clearSession();
  };

  const handleBackFromAge = () => {
    setSession((prev) => ({ ...prev, step: STEPS.WELCOME, ageTier: null }));
  };

  const handleBackFromSituation = () => {
    setSession((prev) => ({ ...prev, step: STEPS.AGE_SELECTION }));
  };

  const handleBackFromDial = () => {
    setSession((prev) => ({ ...prev, step: STEPS.SITUATION_SELECTION }));
  };

  const handleBackFromConversation = () => {
    setSession((prev) => ({ ...prev, step: STEPS.DIALING }));
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
          <AgeSelector onSelect={handleAgeSelected} selectedTier={session.ageTier} onBack={handleBackFromAge} />
        </main>
      </ErrorBoundary>
    );
  }

  // Situation Selection
  if (session.step === STEPS.SITUATION_SELECTION) {
    return (
      <ErrorBoundary>
        <main className="app-page" role="main">
          <SituationSelector onSelect={handleSituationSelected} selectedSituation={session.situation} onBack={handleBackFromSituation} />
        </main>
      </ErrorBoundary>
    );
  }

  // Number Dialing
  if (session.step === STEPS.DIALING) {
    return (
      <ErrorBoundary>
        <main className="app-page" role="main">
          <DialPad onCorrectNumber={handleCorrectNumber} onBack={handleBackFromDial} />
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
            onBack={handleBackFromConversation}
            autoStart={session.fromDialing === true}
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

