/**
 * Gamification system for XP, levels, and badges
 */

import type { Badge, PerformanceMetrics } from '@/types';
import { scoreToXP } from './assessment';
import { logger } from '@/lib/logger';

// Level requirements: XP needed to reach each level
export const LEVEL_REQUIREMENTS: number[] = [
  0, // Level 1
  100, // Level 2
  250, // Level 3 (Badge 1)
  450, // Level 4
  700, // Level 5
  1000, // Level 6 (Badge 2)
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9 (Badge 3)
  2700, // Level 10 (Max level)
];

// Badge definitions - ordered by acquisition difficulty/progress
export const BADGES = {
  // 1. First Call Hero - Completing first emergency call
  FIRST_CALL_HERO: {
    id: 'first-call-hero',
    name: 'First Call Hero',
    image: '/first-call-hero.png',
    description: 'Completed your first emergency call!',
  },
  // 2. Brave Helper - Showing courage in emergency situations
  BRAVE_HELPER: {
    id: 'brave-helper',
    name: 'Brave Helper',
    image: '/brave-helper.png',
    description: 'Helped in a scary emergency situation',
  },
  // 3. Calm Communicator - Communicating clearly under pressure
  CALM_COMMUNICATOR: {
    id: 'calm-communicator',
    name: 'Calm Communicator',
    image: '/callm-communicator.png', // Note: filename has typo in public dir
    description: 'Stayed calm and communicated clearly',
  },
  // 4. Listening Master - Good listening and response skills
  LISTENING_MASTER: {
    id: 'listening_master',
    name: 'Listening Master',
    image: '/listening_master.png',
    description: 'Listened carefully and responded well',
  },
  // 5. Scenario Explorer - Tried different types of emergencies
  SCENARIO_EXPLORER: {
    id: 'scenario_explorer',
    name: 'Scenario Explorer',
    image: '/scenario_explorer.png',
    description: 'Practiced different emergency scenarios',
  },
} as const;

// Badge milestones (levels where badges are awarded)
// Note: First Call Hero is awarded on first conversation, not by level
export const BADGE_MILESTONES: number[] = [6, 9];

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
 * Note: First Call Hero is awarded on first conversation, not by level
 */
export function getBadgeForLevel(level: number): Badge | null {
  if (BADGE_MILESTONES.includes(level)) {
    if (level === 6) return BADGES.BRAVE_HELPER;
    if (level === 9) return BADGES.SCENARIO_EXPLORER;
  }
  return null;
}

/**
 * Get badge for first conversation completion
 */
export function getBadgeForFirstCall(): Badge {
  return BADGES.FIRST_CALL_HERO;
}

/**
 * Get badge based on scenario type (bravery in dangerous situations)
 */
export function getBadgeForScenario(scenario: string): Badge | null {
  if (scenario === 'police') {
    return BADGES.BRAVE_HELPER;
  }
  if (scenario === 'fire') {
    return BADGES.BRAVE_HELPER;
  }
  return null;
}

/**
 * Check if a performance-based badge should be awarded based on score
 */
export function getBadgeForScore(score: number): Badge | null {
  if (score >= 90) {
    return BADGES.CALM_COMMUNICATOR;
  }
  if (score >= 80) {
    return BADGES.LISTENING_MASTER;
  }
  if (score >= 70) {
    return BADGES.BRAVE_HELPER;
  }
  return null;
}

/**
 * Check if scenario explorer badge should be awarded
 */
export function getBadgeForScenariosExplored(
  scenariosCount: number
): Badge | null {
  if (scenariosCount >= 3) {
    // Tried all 3 emergency types
    return BADGES.SCENARIO_EXPLORER;
  }
  return null;
}

/**
 * Calculate XP earned based on performance
 */
export function calculateXPEarned(
  performance: PerformanceMetrics = {}
): number {
  // DEBUG: Log what we're working with
  logger.log('🔍 calculateXPEarned called with:', performance);
  logger.log('🔍 Has assessment?', !!performance.assessment);
  logger.log('🔍 Assessment:', performance.assessment);

  if (performance.assessment) {
    return scoreToXP(performance.assessment.score);
  }

  // Fallback legacy behaviour if no assessment is present
  logger.log('🔍 No assessment found, using fallback XP calculation');
  let xp = 50;
  if (performance.completed) xp += 20;
  if (performance.clearCommunication) xp += 15;
  if (performance.stayedCalm) xp += 15;

  logger.log('🔍 Fallback XP:', xp);
  return Math.min(xp, 100);
}
