'use client';

import Confetti from './Confetti';
import BadgeDisplay from './BadgeDisplay';
import LevelProgress from './LevelProgress';
import AssessmentFeedback from './AssessmentFeedback';
import CompletionActions from './CompletionActions';
import CompletionMessage, { getCompletionTitle } from './CompletionMessage';
import { useCompletionState } from '@/hooks/useCompletionState';
import type { Service, AgeTier, PerformanceMetrics } from '@/types';

interface CompletionScreenProps {
  service?: Service;
  ageTier?: AgeTier;
  performance?: PerformanceMetrics;
  conversationId?: string | null;
}

export default function CompletionScreen({
  service,
  ageTier,
  performance = {},
  conversationId,
}: CompletionScreenProps) {
  const {
    showConfetti,
    xpEarned,
    leveledUp,
    badgeAwarded,
    scoreBadgeAwarded,
    currentLevel,
    isLevel10,
    assessment,
  } = useCompletionState({ service, ageTier, performance });

  const title = getCompletionTitle(isLevel10, xpEarned);
  const showProgress = xpEarned > 0;
  const showBadges = badgeAwarded || scoreBadgeAwarded;

  return (
    <div
      className="completion-content-wrapper"
      role="region"
      aria-label="Completion screen"
    >
      {showConfetti && xpEarned > 0 && (
        <Confetti active={showConfetti} duration={3000} />
      )}

      <header className="completion-header">
        <h1 className="completion-title">{title}</h1>
      </header>

      <div className="completion-content">
        <section className="completion-section" aria-labelledby="message-heading">
          <div className="completion-card">
            <CompletionMessage
              isLevel10={isLevel10}
              xpEarned={xpEarned}
              service={service}
              leveledUp={leveledUp}
              currentLevel={currentLevel}
              badgeAwarded={badgeAwarded}
              assessment={assessment}
            />
          </div>
        </section>

        {showProgress && (
          <section className="completion-section" aria-labelledby="progress-heading">
            <h2 id="progress-heading">Your Progress</h2>
            <div className="completion-card">
              <LevelProgress showLabel={true} />
            </div>
          </section>
        )}

        {showBadges && (
          <section className="completion-section" aria-labelledby="badges-heading">
            <h2 id="badges-heading">Your Badges</h2>
            <div className="completion-card">
              <BadgeDisplay showAll={false} />
            </div>
          </section>
        )}

        {assessment && (
          <section className="completion-section" aria-labelledby="feedback-heading">
            <h2 id="feedback-heading">Feedback</h2>
            <AssessmentFeedback assessment={assessment} />
          </section>
        )}

        <CompletionActions conversationId={conversationId} />
      </div>
    </div>
  );
}
