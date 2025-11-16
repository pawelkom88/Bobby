'use client';

import { useState } from 'react';
import AgeSelector from '@/components/AgeSelector';
import SituationSelector from '@/components/SituationSelector';
import DialPad from '@/components/DialPad';
import VoiceConversation from '@/components/VoiceConversation';
import CompletionScreen from '@/components/CompletionScreen';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import { getUserProgress } from '@/lib/storage';
import type { AgeTierConfig, Situation, PerformanceMetrics } from '@/types';

type Step = 'welcome' | 'age_selection' | 'situation_selection' | 'dialing' | 'conversation' | 'completion';

const STEPS: Record<string, Step> = {
  WELCOME: 'welcome',
  AGE_SELECTION: 'age_selection',
  SITUATION_SELECTION: 'situation_selection',
  DIALING: 'dialing',
  CONVERSATION: 'conversation',
  COMPLETION: 'completion',
};

interface ConversationMessage {
  type: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export default function AppPage() {
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.WELCOME);
  const [selectedAgeTier, setSelectedAgeTier] = useState<AgeTierConfig | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<Situation | null>(null);
  const [conversationData, setConversationData] = useState<ConversationMessage[] | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics>({});

  const progress = getUserProgress();

  const handleCallBobby = () => {
    setCurrentStep(STEPS.AGE_SELECTION);
  };

  const handleAgeSelected = (tier: AgeTierConfig) => {
    setSelectedAgeTier(tier);
    setCurrentStep(STEPS.SITUATION_SELECTION);
  };

  const handleSituationSelected = (situation: Situation) => {
    setSelectedSituation(situation);
    setCurrentStep(STEPS.DIALING);
  };

  const handleCorrectNumber = () => {
    setCurrentStep(STEPS.CONVERSATION);
  };

  const handleConversationComplete = (conversation: ConversationMessage[]) => {
    setConversationData(conversation);
    // Calculate performance metrics
    const perf: PerformanceMetrics = {
      completed: true,
      clearCommunication: conversation.length > 2,
      stayedCalm: true, // Could be enhanced with actual metrics
    };
    setPerformance(perf);
    setCurrentStep(STEPS.COMPLETION);
  };

  const handleContinue = () => {
    // Reset for new scenario
    setSelectedAgeTier(null);
    setSelectedSituation(null);
    setConversationData(null);
    setPerformance({});
    setCurrentStep(STEPS.WELCOME);
  };

  // Welcome Screen
  if (currentStep === STEPS.WELCOME) {
    return (
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
    );
  }

  // Age Selection
  if (currentStep === STEPS.AGE_SELECTION) {
    return (
      <main className="app-page" role="main">
        <AgeSelector onSelect={handleAgeSelected} />
      </main>
    );
  }

  // Situation Selection
  if (currentStep === STEPS.SITUATION_SELECTION) {
    return (
      <main className="app-page" role="main">
        <SituationSelector onSelect={handleSituationSelected} />
      </main>
    );
  }

  // Number Dialing
  if (currentStep === STEPS.DIALING) {
    return (
      <main className="app-page" role="main">
        <DialPad onCorrectNumber={handleCorrectNumber} />
      </main>
    );
  }

  // Voice Conversation
  if (currentStep === STEPS.CONVERSATION) {
    return (
      <main className="app-page" role="main">
        <VoiceConversation
          ageTier={selectedAgeTier?.id}
          situation={selectedSituation?.id}
          onComplete={handleConversationComplete}
        />
      </main>
    );
  }

  // Completion Screen
  if (currentStep === STEPS.COMPLETION) {
    return (
      <main className="app-page" role="main">
        <CompletionScreen
          service={selectedSituation?.id}
          ageTier={selectedAgeTier?.id}
          performance={performance}
          onContinue={handleContinue}
        />
      </main>
    );
  }

  return null;
}

