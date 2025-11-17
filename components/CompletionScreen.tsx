'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import BadgeDisplay from './BadgeDisplay';
import LevelProgress from './LevelProgress';
import { getLevel, addXP, saveConversation } from '@/lib/storage';
import { calculateXPEarned } from '@/lib/gamification';
import type { Service, AgeTier, PerformanceMetrics, Badge } from '@/types';

interface CompletionScreenProps {
  service?: Service;
  ageTier?: AgeTier;
  performance?: PerformanceMetrics;
  onContinue?: () => void;
}

/**
 * Completion screen component with confetti, XP, badges, and level 10 special message
 */
export default function CompletionScreen({ service, ageTier, performance = {}, onContinue }: CompletionScreenProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);
  const [xpEarned, setXPEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [badgeAwarded, setBadgeAwarded] = useState<Badge | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLevel10, setIsLevel10] = useState(false);
  const assessment = performance.assessment;
  const feedbackSummary =
    assessment && assessment.improvements.length > 0
      ? assessment.improvements
      : assessment?.positives ?? [];

  useEffect(() => {
    // Calculate and award XP
    const oldLevel = getLevel();
    const xp = calculateXPEarned(performance);
    setXPEarned(xp);

    const result = addXP(xp);
    setLeveledUp(result.leveledUp);
    setBadgeAwarded(result.badgeAwarded);
    setCurrentLevel(result.newLevel);
    setIsLevel10(result.newLevel === 10);

    // Save conversation
    if (service && ageTier) {
      saveConversation(
        new Date().toISOString(),
        service,
        ageTier,
        xp,
        assessment?.score,
        feedbackSummary?.slice(0, 3)
      );
    }
  }, [service, ageTier, performance]);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      router.push('/app');
    }
  };

  const handleViewAchievements = () => {
    router.push('/achievements');
  };

  return (
    <div className="completion-screen" role="region" aria-label="Completion screen">
      {showConfetti && <Confetti active={showConfetti} duration={3000} />}

      <div className="completion-content">
        {isLevel10 ? (
          <>
            <h1 className="completion-title">🎉 Training Complete! 🎉</h1>
            <p className="completion-message">
              Congratulations! You've mastered emergency calls!
            </p>
            <p className="completion-encouragement">
              You've learned how to stay calm, communicate clearly, and get help when you need it.
              You're now prepared and confident. Great job!
            </p>
            <p className="completion-encouragement">
              Remember, you can always practice more to stay sharp. Keep up the amazing work!
            </p>
          </>
        ) : (
          <>
            <h1 className="completion-title">Well Done! 🎉</h1>
            <p className="completion-message">
              You completed the {service} emergency scenario!
            </p>
            {leveledUp && (
              <div className="level-up-message" role="alert">
                <h2>Level Up! 🚀</h2>
                <p>You reached Level {currentLevel}!</p>
              </div>
            )}
            {badgeAwarded && (
              <div className="badge-awarded-message" role="alert">
                <h2>New Badge Earned! 🏆</h2>
                <p>{badgeAwarded.name}</p>
              </div>
            )}
            <div className="xp-earned">
              <p>You earned {xpEarned} XP!</p>
              {assessment && (
                <p className="assessment-score">Score: {Math.round(assessment.score)} / 100</p>
              )}
            </div>
          </>
        )}

        <div className="completion-progress">
          <LevelProgress showLabel={true} />
        </div>

        {badgeAwarded && (
          <div className="completion-badge">
            <BadgeDisplay showAll={false} />
          </div>
        )}

        {assessment && (
          <div className="assessment-feedback" aria-live="polite">
            <h3>What you did well</h3>
            <ul>
              {assessment.positives.length > 0 ? (
                assessment.positives.map((item, index) => <li key={`pos-${index}`}>{item}</li>)
              ) : (
                <li>Great effort!</li>
              )}
            </ul>

            <h3>Next time try</h3>
            <ul>
              {assessment.improvements.length > 0 ? (
                assessment.improvements.map((item, index) => <li key={`imp-${index}`}>{item}</li>)
              ) : (
                <li>Keep practicing to stay sharp.</li>
              )}
            </ul>

            {assessment.warnings.length > 0 && (
              <>
                <h3>Friendly reminders</h3>
                <ul>
                  {assessment.warnings.map((item, index) => (
                    <li key={`warn-${index}`}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="completion-actions">
          <button
            type="button"
            className="continue-button"
            onClick={handleContinue}
            aria-label="Continue to next scenario"
          >
            Try Another Scenario
          </button>
          <button
            type="button"
            className="achievements-button"
            onClick={handleViewAchievements}
            aria-label="View achievements"
          >
            View Achievements
          </button>
        </div>
      </div>
    </div>
  );
}

