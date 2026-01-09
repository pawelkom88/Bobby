'use client';

import { useUserData } from '@/context/UserDataContext';
import { useTranslations } from 'next-intl';

interface LevelProgressProps {
  showLabel?: boolean;
}

// Level ranges (XP thresholds for each level) - constant, no need to recreate
const LEVEL_RANGES = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];

/**
 * Calculate progress percentage within current level.
 * This is derived state - calculated directly during render, no useEffect needed!
 */
function calculateProgress(level: number, xp: number): number {
  if (level >= 10) {
    return 100;
  }

  const currentLevelStart = LEVEL_RANGES[level - 1] || 0;
  const currentLevelEnd = LEVEL_RANGES[level] || 2700;
  const levelRange = currentLevelEnd - currentLevelStart;
  const xpInLevel = xp - currentLevelStart;
  const percentage = levelRange > 0 ? (xpInLevel / levelRange) * 100 : 0;

  return Math.min(100, Math.max(0, percentage));
}

/**
 * Level progress component displaying current level, XP, and progress bar
 */
export default function LevelProgress({
  showLabel = true,
}: LevelProgressProps) {
  const t = useTranslations('levelProgress');
  const { userData } = useUserData();

  const level = userData.level;
  const xp = userData.totalXP;

  // Calculate progress directly during render - no useState/useEffect needed!
  const progress = calculateProgress(level, xp);

  // Calculate XP to next level
  const currentLevelEnd = LEVEL_RANGES[level] || 2700;
  const xpToNext = Math.max(0, currentLevelEnd - xp);

  return (
    <div
      className="level-progress"
      role="region"
      aria-label={t('regionLabel')}
    >
      {showLabel && (
        <div className="level-progress-label">
          <span>{t('yourScore')}</span>
        </div>
      )}
      <div className="level-progress-content">
        <div className="level-progress-header">
          <span className="level-label">{t('level', { level })}</span>
          <span className="progress-percentage">{Math.round(progress)}%</span>
        </div>
        <div
          className="progress-bar-container"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('progressAriaLabel', {
            level,
            percent: Math.round(progress),
          })}
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress}%`,
            }}
          />
          <div className="progress-bar-text">{Math.round(progress)}%</div>
        </div>
        {level < 10 && showLabel && (
          <div className="xp-label" aria-live="polite">
            {t('xpToNext', { xp: xpToNext })}
          </div>
        )}
      </div>
    </div>
  );
}
