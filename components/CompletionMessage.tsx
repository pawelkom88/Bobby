'use client';

import Image from 'next/image';
import type { Service, ConversationAssessment, Badge } from '@/types';

// ============================================================================
// Helper Functions - Replace complex ternaries with readable functions
// ============================================================================

export function getCompletionTitle(isLevel10: boolean, xpEarned: number): string {
  if (isLevel10) return '🎉 Training Complete! 🎉';
  if (xpEarned === 0) return 'Practice Session Complete';
  return 'Well Done! 🎉';
}

export function getPerformanceImage(score: number): { src: string; alt: string } {
  if (score >= 90) return { src: '/flawless.png', alt: 'Flawless performance!' };
  if (score >= 60) return { src: '/welldone.png', alt: 'Well done!' };
  return { src: '/donotworry.png', alt: "Don't worry, keep practicing!" };
}

// ============================================================================
// Sub-components for different completion states
// ============================================================================

interface Level10MessageProps {
  // No props needed - this is a static congratulations message
}

function Level10Message({}: Level10MessageProps) {
  return (
    <div className="completion-message">
      <p>Congratulations! You&apos;ve mastered emergency calls!</p>
      <p>
        You&apos;ve learned how to stay calm, communicate clearly, and get help
        when you need it. You&apos;re now prepared and confident. Great job!
      </p>
      <p>
        Remember, you can always practice more to stay sharp. Keep up the
        amazing work!
      </p>
    </div>
  );
}

interface NoXPMessageProps {
  service?: Service;
}

function NoXPMessage({ service }: NoXPMessageProps) {
  return (
    <div className="completion-message">
      <p>You tried the {service} emergency scenario.</p>
      <p>
        Don&apos;t worry! Emergency calls can be tricky. Let&apos;s try again
        and you&apos;ll do better!
      </p>
    </div>
  );
}

interface SuccessMessageProps {
  service?: Service;
  xpEarned: number;
  leveledUp: boolean;
  currentLevel: number;
  badgeAwarded: Badge | null;
  assessment?: ConversationAssessment;
}

function SuccessMessage({
  service,
  xpEarned,
  leveledUp,
  currentLevel,
  badgeAwarded,
  assessment,
}: SuccessMessageProps) {
  const { src: imageSrc, alt: imageAlt } = assessment?.score
    ? getPerformanceImage(assessment.score)
    : { src: '/donotworry.png', alt: 'Practice session' };

  return (
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

      <XPDisplay xpEarned={xpEarned} assessment={assessment} />
    </div>
  );
}

interface XPDisplayProps {
  xpEarned: number;
  assessment?: ConversationAssessment;
}

function XPDisplay({ xpEarned, assessment }: XPDisplayProps) {
  return (
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
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface CompletionMessageProps {
  isLevel10: boolean;
  xpEarned: number;
  service?: Service;
  leveledUp: boolean;
  currentLevel: number;
  badgeAwarded: Badge | null;
  assessment?: ConversationAssessment;
}

/**
 * Displays the appropriate completion message based on the user's performance.
 * Uses separate components for each state instead of complex ternaries.
 */
export default function CompletionMessage({
  isLevel10,
  xpEarned,
  service,
  leveledUp,
  currentLevel,
  badgeAwarded,
  assessment,
}: CompletionMessageProps) {
  // Level 10 completion - training complete!
  if (isLevel10) {
    return <Level10Message />;
  }

  // No XP earned - encouragement message
  if (xpEarned === 0) {
    return <NoXPMessage service={service} />;
  }

  // Normal success - show performance details
  return (
    <SuccessMessage
      service={service}
      xpEarned={xpEarned}
      leveledUp={leveledUp}
      currentLevel={currentLevel}
      badgeAwarded={badgeAwarded}
      assessment={assessment}
    />
  );
}

