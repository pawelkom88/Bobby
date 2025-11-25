'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getBadges } from '@/lib/storage';
import { BADGES } from '@/lib/gamification';
import type { Badge } from '@/types';

interface BadgeDisplayProps {
  showAll?: boolean;
  maxVisible?: number;
}

/**
 * Badge display component showing earned badges in tile format
 */
export default function BadgeDisplay({
  showAll = false,
  maxVisible = 1,
}: BadgeDisplayProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

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
  const visibleBadges = isExpanded
    ? displayedBadges
    : displayedBadges.slice(0, maxVisible);
  const hiddenCount = displayedBadges.length - maxVisible;

  // Hide all badges if user has no earned badges
  if (badges.length === 0) {
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
      <div className={`badge-grid ${isExpanded ? 'expanded' : ''}`}>
        {visibleBadges.map(badge => {
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

      {/* Toggle Button - only show if user has earned badges and there are more badges to show */}
      {badges.length > 0 &&
        displayedBadges.length > maxVisible &&
        !isExpanded && (
          <div>
            <button
              onClick={() => setIsExpanded(true)}
              className="cartoon-toggle-btn"
              aria-expanded={isExpanded}
              aria-controls="badge-grid"
              aria-label={`Show all ${displayedBadges.length} badges`}
            >
              <span className="btn-text">Show More</span>
              <span className="btn-icon">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
              <span className="btn-badge">
                {displayedBadges.length - maxVisible}
              </span>
            </button>
          </div>
        )}

      {/* Show Less Button - only show when expanded and user has earned badges */}
      {badges.length > 0 &&
        isExpanded &&
        displayedBadges.length > maxVisible && (
          <div>
            <button
              onClick={() => setIsExpanded(false)}
              className="cartoon-toggle-btn"
              aria-expanded={isExpanded}
              aria-label="Show fewer badges"
            >
              <span className="btn-text">Show Less</span>
              <span className="btn-icon">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </span>
            </button>
          </div>
        )}
    </div>
  );
}
