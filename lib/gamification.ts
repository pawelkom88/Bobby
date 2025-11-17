/**
 * Gamification system for XP, levels, and badges
 */

import type { Badge, PerformanceMetrics } from '@/types';
import { scoreToXP } from './assessment';

// Level requirements: XP needed to reach each level
export const LEVEL_REQUIREMENTS: number[] = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3 (Badge 1)
  450,  // Level 4
  700,  // Level 5
  1000, // Level 6 (Badge 2)
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9 (Badge 3)
  2700, // Level 10 (Max level)
];

// Badge definitions
export const BADGES = {
  LEVEL_3: {
    id: 'first-steps-hero',
    name: 'First Steps Hero',
    levelEarned: 3,
  },
  LEVEL_6: {
    id: 'confident-communicator',
    name: 'Confident Communicator',
    levelEarned: 6,
  },
  LEVEL_9: {
    id: 'emergency-expert',
    name: 'Emergency Expert',
    levelEarned: 9,
  },
} as const;

// Badge milestones (levels where badges are awarded)
export const BADGE_MILESTONES: number[] = [3, 6, 9];

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_REQUIREMENTS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_REQUIREMENTS.length) {
    return 0; // Max level reached
  }
  return LEVEL_REQUIREMENTS[currentLevel];
}

/**
 * Get XP needed to reach next level from current XP
 */
export function getXPToNextLevel(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  const xpForNextLevel = getXPForNextLevel(currentLevel);
  if (xpForNextLevel === 0) {
    return 0; // Max level
  }
  return xpForNextLevel - totalXP;
}

/**
 * Check if a badge should be awarded for reaching a level
 */
export function getBadgeForLevel(level: number): Badge | null {
  if (BADGE_MILESTONES.includes(level)) {
    if (level === 3) return BADGES.LEVEL_3;
    if (level === 6) return BADGES.LEVEL_6;
    if (level === 9) return BADGES.LEVEL_9;
  }
  return null;
}

/**
 * Calculate XP earned based on performance
 */
export function calculateXPEarned(performance: PerformanceMetrics = {}): number {
  if (performance.assessment) {
    return scoreToXP(performance.assessment.score);
  }

  // Fallback legacy behaviour if no assessment is present
  let xp = 50;
  if (performance.completed) xp += 20;
  if (performance.clearCommunication) xp += 15;
  if (performance.stayedCalm) xp += 15;

  return Math.min(xp, 100);
}

