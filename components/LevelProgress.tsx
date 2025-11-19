'use client';

import { useEffect, useState } from 'react';
import { getLevel, getXP, getXPToNextLevelValue } from '@/lib/storage';

interface LevelProgressProps {
  showLabel?: boolean;
}

/**
 * Level progress component displaying current level, XP, and progress bar
 */
export default function LevelProgress({ showLabel = true }: LevelProgressProps) {
  const [level, setLevel] = useState(1);
  const [xp, setXP] = useState(0);
  const [xpToNext, setXPToNext] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Update progress on mount and when storage changes
    const updateProgress = () => {
      const currentLevel = getLevel();
      const currentXP = getXP();
      const xpNeeded = getXPToNextLevelValue();
      
      setLevel(currentLevel);
      setXP(currentXP);
      setXPToNext(xpNeeded);
      
      // Calculate progress percentage
      if (currentLevel >= 10) {
        setProgress(100);
      } else {
        // Get XP range for current level
        const levelRanges = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
        const currentLevelStart = levelRanges[currentLevel - 1] || 0;
        const currentLevelEnd = levelRanges[currentLevel] || 2700;
        const levelRange = currentLevelEnd - currentLevelStart;
        const xpInLevel = currentXP - currentLevelStart;
        const percentage = levelRange > 0 ? (xpInLevel / levelRange) * 100 : 0;
        setProgress(Math.min(100, Math.max(0, percentage)));
      }
    };

    updateProgress();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      updateProgress();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically (in case of same-tab updates)
    const interval = setInterval(updateProgress, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
        <div className="progress-bar-container" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Level ${level} progress ${Math.round(progress)}%`}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress}%`,
            }}
          />
          <div className="progress-bar-text">
            {Math.round(progress)}%
          </div>
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

