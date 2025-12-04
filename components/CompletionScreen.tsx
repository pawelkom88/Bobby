'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import BadgeDisplay from './BadgeDisplay';
import LevelProgress from './LevelProgress';
import { useUserData } from '@/context/UserDataContext';
import { useSecureSession } from '@/hooks/useSecureSession';
import { calculateXPEarned } from '@/lib/gamification';
import { playFanfareSound } from '@/lib/uiSound';
import type { Service, AgeTier, PerformanceMetrics, Badge } from '@/types';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';
import Image from 'next/image';

// Determine image based on assessment score
const getPerformanceImage = (score: number) => {
  if (score >= 90) {
    return { src: '/flawless.png', alt: 'Flawless performance!' };
  }
  if (score >= 60) {
    return { src: '/welldone.png', alt: 'Well done!' };
  }
  return { src: '/donotworry.png', alt: "Don't worry, keep practicing!" };
};

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
  const router = useRouter();
  const { addXP, saveConversation, awardScoreBadge, getLevel } = useUserData();
  const { getSession, clearSession } = useSecureSession();
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
    const processCompletion = async () => {
      const sessionData = await getSession();
      const assessmentData = sessionData?.lastAssessment;
      const completionId = sessionData?.completionId;
      const processedId = sessionData?.processedCompletionId;

      logger.log('🔍 ===== COMPLETION SCREEN USEEFFECT =====');
      logger.log('🔍 completionId:', completionId);
      logger.log('🔍 processedId:', processedId);
      logger.log(
        '🔍 completionId === processedId:',
        completionId === processedId
      );
      logger.log('🔍 service:', service);
      logger.log('🔍 ageTier:', ageTier);
      logger.log('🔍 performance:', performance);
      logger.log('🔍 performance.assessment:', performance.assessment);

      // CRITICAL: Don't award XP until we have the assessment data
      if (!performance.assessment) {
        logger.log(
          '🔍 ⏳ WAITING: No assessment in performance yet, skipping this render'
        );
        return;
      }

      // If we have assessment data but no completionId, this is a page refresh - skip XP award
      if (assessmentData && !completionId) {
        logger.log('🔍 ❌ PATH 1: Page refresh detected, skipping XP award');
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
      if (!completionId || completionId === processedId) {
        // Already processed, missing completionId, or no valid completion, just display existing results
        logger.log(
          '🔍 ❌ PATH 2: Completion already processed or invalid, skipping XP award'
        );
        logger.log(
          'Completion already processed or invalid, skipping XP award',
          {
            completionId,
            processedId,
            hasCompletionId: !!completionId,
          }
        );
        const xp = calculateXPEarned(performance);
        setXPEarned(xp);
        setCurrentLevel(getLevel());
        return;
      }

      logger.log('🔍 ✅ PATH 3: Awarding XP for new completion');
      logger.log('Awarding XP for new completion', {
        completionId,
        processedId,
      });

      // DEBUG: Log performance object
      logger.log('🔍 COMPLETION SCREEN - Performance object:', performance);
      logger.log('🔍 Assessment exists?', !!performance.assessment);
      logger.log('🔍 Assessment:', performance.assessment);
      logger.log('🔍 Assessment score:', performance.assessment?.score);

      // Calculate and award XP (first time only)
      const oldLevel = getLevel();
      const xp = calculateXPEarned(performance);
      logger.log('🔍 XP calculated:', xp);
      logger.log('🔍 Old level:', oldLevel);
      setXPEarned(xp);

      // Only show confetti if XP was earned
      if (xp > 0) {
        setShowConfetti(true);
        // Play fanfare sound for successful completion
        playFanfareSound(true).catch(() => {
          // Ignore audio errors silently
        });
      }

      // CRITICAL: Run these operations SEQUENTIALLY to avoid race conditions
      // Each operation reads from Firestore, modifies data, and writes back
      // Running them in parallel causes them to overwrite each other's changes
      try {
        // Step 1: Award XP and handle level up
        logger.log('🔍 STEP 1: Adding XP...');
        const result = await addXP(xp);
        setLeveledUp(result.leveledUp);
        setBadgeAwarded(result.badgeAwarded);
        setCurrentLevel(result.newLevel);
        setIsLevel10(result.newLevel === 10);
        logger.log('🔍 STEP 1 COMPLETE: XP added');

        // Step 2: Award score-based badge if applicable
        if (assessment?.score) {
          logger.log('🔍 STEP 2: Awarding score badge...');
          const scoreBadge = await awardScoreBadge(assessment.score);
          if (scoreBadge) {
            setScoreBadgeAwarded(scoreBadge);
          }
          logger.log('🔍 STEP 2 COMPLETE: Score badge awarded');
        }

        // Step 3: Save conversation (this will also award First Call Hero badge if it's the first conversation)
        if (service && ageTier) {
          logger.log('🔍 STEP 3: Saving conversation...');
          await saveConversation(
            new Date().toISOString(),
            service,
            ageTier,
            xp,
            assessment?.score,
            feedbackSummary?.slice(0, 3)
          );
          logger.log('🔍 STEP 3 COMPLETE: Conversation saved');
        }

        logger.log('🔍 ✅ ALL STEPS COMPLETE');
      } catch (error) {
        logger.error('Error in completion flow:', error);
      }
    };

    processCompletion();
  }, [service, ageTier, performance.assessment, getSession]);

  const handleContinue = async () => {
    // Clear completion data when starting a new conversation
    await clearSession();
    router.push(ROUTES.YOUR_AGE);
  };

  const handleViewAchievements = () => {
    router.push(ROUTES.ACHIEVEMENTS);
  };

  const { src: imageSrc, alt: imageAlt } = assessment?.score
    ? getPerformanceImage(assessment.score)
    : { src: '/donotworry.png', alt: 'Practice session' };

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
                <Image
                  className="completion-image"
                  preload
                  width={250}
                  height={200}
                  src={imageSrc}
                  alt={imageAlt}
                />
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
                <ul className="feedback-list">
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

        <div className="completion-actions">
          <button
            onClick={handleContinue}
            className="cartoon-btn"
            aria-label="Practice again"
          >
            <span>Practice Again</span>
          </button>
          <button
            onClick={handleViewAchievements}
            className="cartoon-btn cartoon-btn--secondary"
            aria-label="View achievements"
          >
            <span>View Achievements</span>
          </button>
          <button
            onClick={() =>
              router.push(
                conversationId
                  ? `${ROUTES.CHATS}/${conversationId}`
                  : ROUTES.CHATS
              )
            }
            className="cartoon-btn cartoon-btn--tertiary"
            aria-label="View conversation history"
          >
            <span>View Conversation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
