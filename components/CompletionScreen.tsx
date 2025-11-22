'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import BadgeDisplay from './BadgeDisplay';
import LevelProgress from './LevelProgress';
import CartoonButton from './CartoonButton';
import { getLevel, addXP, saveConversation, awardScoreBadge } from '@/lib/storage';
import { calculateXPEarned } from '@/lib/gamification';
import type { Service, AgeTier, PerformanceMetrics, Badge } from '@/types';

interface CompletionScreenProps {
  service?: Service;
  ageTier?: AgeTier;
  performance?: PerformanceMetrics;
  onContinue?: () => void;
  onViewAchievements?: () => void;
}

/**
 * Completion screen component with confetti, XP, badges, and level 10 special message
 */
export default function CompletionScreen({ service, ageTier, performance = {}, onContinue, onViewAchievements }: CompletionScreenProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXPEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [badgeAwarded, setBadgeAwarded] = useState<Badge | null>(null);
  const [scoreBadgeAwarded, setScoreBadgeAwarded] = useState<Badge | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLevel10, setIsLevel10] = useState(false);
  const assessment = performance.assessment;
  const feedbackSummary =
    assessment && assessment.improvements.length > 0
      ? assessment.improvements
      : assessment?.positives ?? [];

  useEffect(() => {
    // Check if this completion has already been processed to prevent duplicate XP awards
    if (typeof window !== 'undefined') {
      const completionId = sessionStorage.getItem('completionId');
      const processedId = sessionStorage.getItem('processedCompletionId');
      
      // Only award XP if this completion hasn't been processed yet
      if (completionId && completionId === processedId) {
        // Already processed, just display existing results
        console.log('Completion already processed, skipping XP award');
        const xp = calculateXPEarned(performance);
        setXPEarned(xp);
        setCurrentLevel(getLevel());
        return;
      }
      
      // Calculate and award XP (first time only)
      const oldLevel = getLevel();
      const xp = calculateXPEarned(performance);
      setXPEarned(xp);

      // Only show confetti if XP was earned
      if (xp > 0) {
        setShowConfetti(true);
      }

      const result = addXP(xp);
      setLeveledUp(result.leveledUp);
      setBadgeAwarded(result.badgeAwarded);
      setCurrentLevel(result.newLevel);
      setIsLevel10(result.newLevel === 10);

      // Award score-based badge if applicable
      if (assessment?.score) {
        const scoreBadge = awardScoreBadge(assessment.score);
        if (scoreBadge) {
          setScoreBadgeAwarded(scoreBadge);
        }
      }

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
      
      // Mark this completion as processed
      if (completionId) {
        sessionStorage.setItem('processedCompletionId', completionId);
      }
    } else {
      // Fallback for SSR or if sessionStorage is not available
      const xp = calculateXPEarned(performance);
      setXPEarned(xp);
      setCurrentLevel(getLevel());
    }
  }, [service, ageTier, performance]);

  const handleContinue = () => {
    // Clear completion data when starting a new conversation
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lastAssessment');
      sessionStorage.removeItem('completionId');
      sessionStorage.removeItem('processedCompletionId');
      sessionStorage.removeItem('conversationComplete');
    }
    
    if (onContinue) {
      onContinue();
    } else {
      router.push('/app');
    }
  };

  const handleViewAchievements = () => {
    if (onViewAchievements) {
      onViewAchievements();
    }
    router.push('/achievements');
  };

  return (
    <div className="completion-screen" role="region" aria-label="Completion screen">
      {showConfetti && xpEarned > 0 && <Confetti active={showConfetti} duration={3000} />}

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
        ) : xpEarned === 0 ? (
          <>
            <h1 className="completion-title">Practice Session Complete</h1>
            <p className="completion-message">
              You tried the {service} emergency scenario.
            </p>
            <p className="completion-encouragement">
              Don't worry! Emergency calls can be tricky. Let's try again and you'll do better!
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
            {scoreBadgeAwarded && (
              <div className="badge-awarded-message" role="alert">
                <h2>Performance Badge! ⭐</h2>
                <p>{scoreBadgeAwarded.name}</p>
                {scoreBadgeAwarded.description && (
                  <p className="badge-description">{scoreBadgeAwarded.description}</p>
                )}
              </div>
            )}
            <div className="xp-earned">
              {xpEarned > 0 ? (
                <p>You earned {xpEarned} XP!</p>
              ) : (
                <p className="no-xp-message">No XP earned this time</p>
              )}
              {assessment && (
                <p className="assessment-score">Score: {Math.round(assessment.score)} / 100</p>
              )}
            </div>
          </>
        )}

        {xpEarned > 0 && (
          <div className="completion-progress">
            <LevelProgress showLabel={true} />
          </div>
        )}

        {(badgeAwarded || scoreBadgeAwarded) && (
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
          <CartoonButton
            onClick={handleContinue}
            ariaLabel="Continue to next scenario"
          >
            Try Another Scenario
          </CartoonButton>
          <CartoonButton
            onClick={handleViewAchievements}
            ariaLabel="View achievements"
          >
            View Achievements
          </CartoonButton>
        </div>
      </div>
    </div>
  );
}

