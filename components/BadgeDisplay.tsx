'use client';

import { useEffect, useState } from 'react';
import { getBadges } from '@/lib/storage';
import type { Badge } from '@/types';

interface BadgeDisplayProps {
  showAll?: boolean;
}

/**
 * Badge display component showing earned badges in tile format
 */
export default function BadgeDisplay({ showAll = false }: BadgeDisplayProps) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const updateBadges = () => {
      const earnedBadges = getBadges();
      setBadges(earnedBadges);
    };

    updateBadges();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      updateBadges();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check periodically for same-tab updates
    const interval = setInterval(updateBadges, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // All possible badges (for showing locked ones if showAll is true)
  const allBadges: Badge[] = [
    { id: 'first-steps-hero', name: 'First Steps Hero', levelEarned: 3 },
    { id: 'confident-communicator', name: 'Confident Communicator', levelEarned: 6 },
    { id: 'emergency-expert', name: 'Emergency Expert', levelEarned: 9 },
  ];

  const displayedBadges = showAll ? allBadges : badges;

  if (displayedBadges.length === 0 && !showAll) {
    return (
      <div className="badge-display" role="region" aria-label="Badges">
        <p className="no-badges-message">No badges earned yet. Keep practicing!</p>
      </div>
    );
  }

  return (
    <div className="badge-display" role="region" aria-label="Badges">
      <div className="badge-grid">
        {displayedBadges.map((badge) => {
          const isEarned = badges.some((b) => b.id === badge.id);
          return (
            <div
              key={badge.id}
              className={`badge-tile ${isEarned ? 'earned' : 'locked'}`}
              role="article"
              aria-label={`${badge.name} badge ${isEarned ? 'earned' : 'locked'}`}
            >
              <div className="badge-icon" aria-hidden="true">
                {isEarned ? (
                  <span>🏆</span>
                ) : (
                  <div className="padlock-wrapper">
                    <input id={`lock-${badge.id}`} type="checkbox" name="unlocked" value="1" aria-hidden="true" />
                    <label htmlFor={`lock-${badge.id}`} className="padlock">
                      <div className="padlock__sr">Unlock</div>
                      <div className="padlock__top">
                        <div className="padlock__top-a"></div>
                        <div className="padlock__top-b"></div>
                      </div>
                      <div className="padlock__bottom"></div>
                    </label>
                  </div>
                )}
              </div>
              <div className="badge-name">{badge.name}</div>
              {isEarned && (
                <div className="badge-level">Level {badge.levelEarned}</div>
              )}
              {!isEarned && showAll && (
                <div className="badge-requirement">Reach Level {badge.levelEarned}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

