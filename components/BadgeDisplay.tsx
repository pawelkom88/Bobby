'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getBadges } from '@/lib/storage';
import { BADGES } from '@/lib/gamification';
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
    BADGES.FIRST_CALL_HERO,
    BADGES.BRAVE_HELPER,
    BADGES.CALM_COMMUNICATOR,
    BADGES.LISTENING_MASTER,
    BADGES.SCENARIO_EXPLORER,
  ];

  const displayedBadges = showAll ? allBadges : badges;

  if (displayedBadges.length === 0 && !showAll) {
    return (
      <div className="badge-display" role="region" aria-label="Badges">
        <p className="no-badges-message">
          No badges earned yet. Keep practicing!
        </p>
      </div>
    );
  }

  return (
    <div className="badge-display" role="region" aria-label="Badges">
      <div className="badge-grid">
        {displayedBadges.map(badge => {
          const isEarned = badges.some(b => b.id === badge.id);
          return (
            <div
              key={badge.id}
              className={`badge-tile ${isEarned ? 'earned' : 'locked'}`}
              role="article"
              aria-label={`${badge.name} badge ${isEarned ? 'earned' : 'locked'}`}
            >
              <div className="badge-icon" aria-hidden="true">
                <Image
                  src={badge.image!}
                  alt={`${badge.name} badge ${isEarned ? 'earned' : 'locked'}`}
                  className={`badge-image ${isEarned ? 'earned' : 'locked'}`}
                  width={300}
                  height={300}
                  loading="lazy"
                />
              </div>
              <div className="badge-name">{badge.name}</div>
              {isEarned && badge.description && (
                <div className="badge-description">{badge.description}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
