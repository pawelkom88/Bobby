'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Service, ConversationAssessment, Badge } from '@/types';

// ============================================================================
// Helper Functions - Replace complex ternaries with readable functions
// ============================================================================

export function getCompletionTitle(isLevel10: boolean, xpEarned: number, t: (key: string) => string): string {
  if (isLevel10) return t('title.trainingComplete');
  if (xpEarned === 0) return t('title.practiceComplete');
  return t('title.wellDone');
}

export function getPerformanceImage(score: number, t: (key: string) => string): { src: string; alt: string } {
  if (score >= 90) return { src: '/flawless.png', alt: t('performance.flawless') };
  if (score >= 60) return { src: '/welldone.png', alt: t('performance.wellDone') };
  return { src: '/donotworry.png', alt: t('performance.keepPracticing') };
}

// ============================================================================
// Sub-components for different completion states
// ============================================================================

interface Level10MessageProps {
  t: (key: string) => string;
}

function Level10Message({ t }: Level10MessageProps) {
  return (
    <div className="completion-message">
      <p>{t('level10.congratulations')}</p>
      <p>{t('level10.mastered')}</p>
      <p>{t('level10.keepPracticing')}</p>
    </div>
  );
}

interface NoXPMessageProps {
  service?: Service;
  t: (key: string, values?: Record<string, string>) => string;
}

function NoXPMessage({ service, t }: NoXPMessageProps) {
  const tServices = useTranslations('services');
  const translatedService = service ? tServices(service) : '';
  return (
    <div className="completion-message">
      <p>{t('noXP.tried', { service: translatedService })}</p>
      <p>{t('noXP.encouragement')}</p>
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
  t: (key: string, values?: Record<string, string | number>) => string;
}

function SuccessMessage({
  service,
  xpEarned,
  leveledUp,
  currentLevel,
  badgeAwarded,
  assessment,
  t,
}: SuccessMessageProps) {
  const tServices = useTranslations('services');
  const translatedService = service ? tServices(service) : '';
  const { src: imageSrc, alt: imageAlt } = assessment?.score
    ? getPerformanceImage(assessment.score, t)
    : { src: '/donotworry.png', alt: t('performance.practiceSession') };

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
      <p>{t('success.completed', { service: translatedService })}</p>

      {leveledUp && (
        <div className="level-up-message" role="alert">
          <h2>{t('success.levelUp')}</h2>
          <p>{t('success.reachedLevel', { level: currentLevel })}</p>
        </div>
      )}

      {badgeAwarded && (
        <div className="badge-awarded-message" role="alert">
          <h2>{t('success.newBadge')}</h2>
          <p>{badgeAwarded.name}</p>
        </div>
      )}

      <XPDisplay xpEarned={xpEarned} assessment={assessment} t={t} />
    </div>
  );
}

interface XPDisplayProps {
  xpEarned: number;
  assessment?: ConversationAssessment;
  t: (key: string, values?: Record<string, number>) => string;
}

function XPDisplay({ xpEarned, assessment, t }: XPDisplayProps) {
  return (
    <div className="xp-earned">
      {xpEarned > 0 ? (
        <p>{t('xp.earned', { xp: xpEarned })}</p>
      ) : (
        <p className="no-xp-message">{t('xp.noXP')}</p>
      )}
      {assessment && (
        <p className="assessment-score">
          {t('xp.score', { score: Math.round(assessment.score) })}
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
  const t = useTranslations('completionMessage');

  // Level 10 completion - training complete!
  if (isLevel10) {
    return <Level10Message t={t} />;
  }

  // No XP earned - encouragement message
  if (xpEarned === 0) {
    return <NoXPMessage service={service} t={t} />;
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
      t={t}
    />
  );
}

