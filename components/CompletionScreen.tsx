'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import BadgeDisplay from './BadgeDisplay';
import LevelProgress from './LevelProgress';
import CartoonButton from './CartoonButton';
import {
  getLevel,
  addXP,
  saveConversation,
  awardScoreBadge,
} from '@/lib/storage';
import { calculateXPEarned } from '@/lib/gamification';
import { playFanfareSound } from '@/lib/uiSound';
import type { Service, AgeTier, PerformanceMetrics, Badge } from '@/types';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';

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
export default function CompletionScreen({
  service,
  ageTier,
  performance = {},
  onContinue,
  onViewAchievements,
}: CompletionScreenProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXPEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [badgeAwarded, setBadgeAwarded] = useState<Badge | null>(null);
  const [scoreBadgeAwarded, setScoreBadgeAwarded] = useState<Badge | null>(
    null
  );
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLevel10, setIsLevel10] = useState(false);
  const assessment = performance.assessment;
  const feedbackSummary =
    assessment && assessment.improvements.length > 0
      ? assessment.improvements
      : (assessment?.positives ?? []);

  useEffect(() => {
    // Check if this completion has already been processed to prevent duplicate XP awards
    if (typeof window !== 'undefined') {
      const assessmentData = sessionStorage.getItem('lastAssessment');
      const completionId = sessionStorage.getItem('completionId');
      const processedId = sessionStorage.getItem('processedCompletionId');

      // Additional safeguard: check if this completionId was already processed in localStorage
      const processedCompletions = JSON.parse(
        localStorage.getItem('processedCompletions') || '[]'
      );
      const alreadyProcessed = processedCompletions.includes(completionId);

      // If we have assessment data but no completionId, this is a page refresh - skip XP award
      if (assessmentData && !completionId) {
        logger.log('Page refresh detected, skipping XP award', {
          assessmentData: !!assessmentData,
          completionId,
        });
        const xp = calculateXPEarned(performance);
        setXPEarned(xp);
        setCurrentLevel(getLevel());
        return;
      }

      // Only award XP if we have a valid completionId that hasn't been processed
      if (!completionId || alreadyProcessed || completionId === processedId) {
        // Already processed, missing completionId, or no valid completion, just display existing results
        logger.log(
          'Completion already processed or invalid, skipping XP award',
          {
            completionId,
            processedId,
            alreadyProcessed,
            hasCompletionId: !!completionId,
          }
        );
        const xp = calculateXPEarned(performance);
        setXPEarned(xp);
        setCurrentLevel(getLevel());
        return;
      }

      logger.log('Awarding XP for new completion', {
        completionId,
        processedId,
        alreadyProcessed,
      });

      // Calculate and award XP (first time only)
      const oldLevel = getLevel();
      const xp = calculateXPEarned(performance);
      setXPEarned(xp);

      // Only show confetti if XP was earned
      if (xp > 0) {
        setShowConfetti(true);
        // Play fanfare sound for successful completion
        playFanfareSound(true).catch(() => {
          // Ignore audio errors silently
        });
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

        // Additional safeguard: persist in localStorage to survive refreshes
        const processedCompletions = JSON.parse(
          localStorage.getItem('processedCompletions') || '[]'
        );
        if (!processedCompletions.includes(completionId)) {
          processedCompletions.push(completionId);
          localStorage.setItem(
            'processedCompletions',
            JSON.stringify(processedCompletions)
          );
        }
      }
    } else {
      // Fallback for SSR or if sessionStorage is not available
      const xp = calculateXPEarned(performance);
      setXPEarned(xp);
      setCurrentLevel(getLevel());
    }
  }, [service, ageTier]);

  const handleContinue = () => {
    // Clear completion data when starting a new conversation
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lastAssessment');
      sessionStorage.removeItem('completionId');
      sessionStorage.removeItem('processedCompletionId');
      sessionStorage.removeItem('conversationComplete');
    }

    router.push(ROUTES.YOUR_AGE);
  };

  const handleViewAchievements = () => {
    router.push(ROUTES.ACHIEVEMENTS);
  };

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
        <h1 className="completion-title">
          {isLevel10
            ? '🎉 Training Complete! 🎉'
            : xpEarned === 0
              ? 'Practice Session Complete'
              : 'Well Done! 🎉'}
        </h1>
      </header>

      <div className="completion-content">
        <section
          className="completion-section"
          aria-labelledby="message-heading"
        >
          <div className="completion-card">
            {isLevel10 ? (
              <div className="completion-message">
                <p>Congratulations! You've mastered emergency calls!</p>
                <p>
                  You've learned how to stay calm, communicate clearly, and get
                  help when you need it. You're now prepared and confident.
                  Great job!
                </p>
                <p>
                  Remember, you can always practice more to stay sharp. Keep up
                  the amazing work!
                </p>
              </div>
            ) : xpEarned === 0 ? (
              <div className="completion-message">
                <p>You tried the {service} emergency scenario.</p>
                <p>
                  Don't worry! Emergency calls can be tricky. Let's try again
                  and you'll do better!
                </p>
              </div>
            ) : (
              <div className="completion-message">
                <p>You completed the {service} emergency scenario!</p>
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
                      <p className="badge-description">
                        {scoreBadgeAwarded.description}
                      </p>
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
                    <p className="assessment-score">
                      Score: {Math.round(assessment.score)} / 100
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {xpEarned > 0 && (
          <section
            className="completion-section"
            aria-labelledby="progress-heading"
          >
            <h2 id="progress-heading">Your Progress</h2>
            <div className="completion-card">
              <LevelProgress showLabel={true} />
            </div>
          </section>
        )}

        {(badgeAwarded || scoreBadgeAwarded) && (
          <section
            className="completion-section"
            aria-labelledby="badges-heading"
          >
            <h2 id="badges-heading">Your Badges</h2>
            <div className="completion-card">
              <BadgeDisplay showAll={false} />
            </div>
          </section>
        )}

        {assessment && (
          <section
            className="completion-section"
            aria-labelledby="feedback-heading"
          >
            <h2 id="feedback-heading">Feedback</h2>
            <div
              className="completion-card assessment-feedback"
              aria-live="polite"
            >
              <div>
                <h3>What you did well</h3>
                <ul>
                  {assessment.positives.length > 0 ? (
                    assessment.positives.map((item, index) => (
                      <li key={`pos-${index}`}>{item}</li>
                    ))
                  ) : (
                    <li>Great effort!</li>
                  )}
                </ul>
              </div>

              <div>
                <h3>Next time try</h3>
                <ul>
                  {assessment.improvements.length > 0 ? (
                    assessment.improvements.map((item, index) => (
                      <li key={`imp-${index}`}>{item}</li>
                    ))
                  ) : (
                    <li>Keep practicing to stay sharp.</li>
                  )}
                </ul>
              </div>

              {assessment.warnings.length > 0 && (
                <div>
                  <h3>Friendly reminders</h3>
                  <ul>
                    {assessment.warnings.map((item, index) => (
                      <li key={`warn-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
