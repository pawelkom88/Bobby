'use client';

import { useEffect, useState } from 'react';
import { useUserData } from '@/context/UserDataContext';

interface LevelProgressProps {
  showLabel?: boolean;
}

/**
 * Level progress component displaying current level, XP, and progress bar
 */
export default function LevelProgress({
  showLabel = true,
}: LevelProgressProps) {
  const { userData } = useUserData();
  const [progress, setProgress] = useState(0);

  const level = userData.level;
  const xp = userData.totalXP;

  useEffect(() => {
    // Calculate progress percentage
    if (level >= 10) {
      setProgress(100);
    } else {
      // Get XP range for current level
      const levelRanges = [
        0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
      ];
      const currentLevelStart = levelRanges[level - 1] || 0;
      const currentLevelEnd = levelRanges[level] || 2700;
      const levelRange = currentLevelEnd - currentLevelStart;
      const xpInLevel = xp - currentLevelStart;
      const percentage = levelRange > 0 ? (xpInLevel / levelRange) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, percentage)));
    }
  }, [level, xp]);

  // Calculate XP to next level
  const levelRanges = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
  const currentLevelEnd = levelRanges[level] || 2700;
  const xpToNext = Math.max(0, currentLevelEnd - xp);

  return (
    <div className="level-progress" role="region" aria-label="Level progress">
      {showLabel && (
        <div className="level-progress-label">
          <span>YOUR SCORE</span>
        </div>
      )}
      <div className="level-progress-content">
        <div className="level-progress-header">
          <span className="level-label">LEVEL {level}</span>
          <span className="progress-percentage">{Math.round(progress)}%</span>
        </div>
        <div
          className="progress-bar-container"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${level} progress ${Math.round(progress)}%`}
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
            {xpToNext} XP to next level
          </div>
        )}
      </div>
    </div>
  );
}
