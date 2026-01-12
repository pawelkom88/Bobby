/**
 * localStorage utilities for user data, progress, and settings
 */

import {
  calculateLevel,
  getXPToNextLevel,
  getBadgeForLevel,
  getBadgeForScore,
} from './gamification';
import {
  validateAgeTier,
  validateService,
  validateXP,
  validateTimestamp,
} from './validation';
import type {
  UserData,
  UserSettings,
  Conversation,
  Service,
  AgeTier,
  Badge,
  LevelUpResult,
  JourneyState,
} from '@/types';
import {logger} from "@/lib/logger";

const STORAGE_KEY = 'bobby-app-data';

/**
 * Get default data structure
 */
function getDefaultData(): UserData {
  return {
    userName: '',
    totalXP: 0,
    level: 1,
    conversations: [],
    badges: [],
    settings: {
      subtitles: true,
      slowedSpeech: false,
      reducedSensory: false,
      fontSize: 'medium',
      colorMode: 'default',
      dyslexiaFont: false,
    },
  };
}

/**
 * Get all user data from localStorage
 */
export function getUserData(): UserData {
  if (typeof window === 'undefined') {
    return getDefaultData();
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return getDefaultData();
    }
    return JSON.parse(data) as UserData;
  } catch (error) {
    logger.error('Error reading from localStorage:', error);
    return getDefaultData();
  }
}

/**
 * Save user data to localStorage
 */
function saveUserData(data: UserData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    logger.error('Error saving to localStorage:', error);
  }
}

/**
 * Save a conversation
 */
export function saveConversation(
  timestamp: string,
  service: Service,
  ageTier: AgeTier,
  xpEarned: number,
  score?: number,
  feedback?: string[],
  conversationId?: string
): void {
  // Validate inputs
  if (!validateTimestamp(timestamp)) {
    logger.error('Invalid timestamp:', timestamp);
    return;
  }
  if (!validateService(service)) {
    logger.error('Invalid service:', service);
    return;
  }
  if (!validateAgeTier(ageTier)) {
    logger.error('Invalid age tier:', ageTier);
    return;
  }
  if (!validateXP(xpEarned)) {
    logger.error('Invalid XP amount:', xpEarned);
    return;
  }

  const data = getUserData();
  const conversationEntry = {
    timestamp,
    service,
    ageTier,
    xpEarned,
    ...(typeof score === 'number' ? { score } : {}),
    ...(feedback && feedback.length ? { feedback } : {}),
    ...(conversationId ? { conversationId } : {}),
  };

  data.conversations.push(conversationEntry);
  saveUserData(data);
}

/**
 * Add XP and check for level up
 */
export function addXP(amount: number): LevelUpResult {
  // Validate XP amount
  if (!validateXP(amount)) {
    logger.error('Invalid XP amount:', amount);
    return {
      newLevel: getLevel(),
      leveledUp: false,
      badgeAwarded: null,
      totalXP: getXP(),
    };
  }

  const data = getUserData();
  const oldLevel = data.level;
  data.totalXP = Math.max(0, data.totalXP + amount); // Ensure non-negative
  data.level = calculateLevel(data.totalXP);
  const newLevel = data.level;
  const leveledUp = newLevel > oldLevel;

  let badgeAwarded: Badge | null = null;
  if (leveledUp) {
    const badge = getBadgeForLevel(newLevel);
    if (badge) {
      // Check if badge already exists
      const existingBadge = data.badges.find(b => b.id === badge.id);
      if (!existingBadge) {
        badgeAwarded = {
          ...badge,
          timestamp: new Date().toISOString(),
        };
        data.badges.push(badgeAwarded);
      }
    }
  }

  saveUserData(data);

  return {
    newLevel,
    leveledUp,
    badgeAwarded,
    totalXP: data.totalXP,
  };
}

/**
 * Get current level
 */
export function getLevel(): number {
  const data = getUserData();
  return data.level;
}

/**
 * Get total XP
 */
export function getXP(): number {
  const data = getUserData();
  return data.totalXP;
}

/**
 * Get XP needed for next level
 */
export function getXPToNextLevelValue(): number {
  const data = getUserData();
  return getXPToNextLevel(data.totalXP);
}

/**
 * Get all earned badges
 */
export function getBadges(): Badge[] {
  const data = getUserData();
  return data.badges;
}

/**
 * Check if level up occurred (used after adding XP)
 */
export function checkLevelUp(oldLevel: number, newLevel: number): Badge | null {
  if (newLevel > oldLevel) {
    return getBadgeForLevel(newLevel);
  }
  return null;
}

/**
 * Get all conversations
 */
export function getConversations(): Conversation[] {
  const data = getUserData();
  return data.conversations;
}

/**
 * Get user progress summary
 */
export function getUserProgress() {
  const data = getUserData();
  return {
    level: data.level,
    totalXP: data.totalXP,
    xpToNextLevel: getXPToNextLevel(data.totalXP),
    badges: data.badges,
    conversations: data.conversations,
    userName: data.userName,
  };
}

/**
 * Reset all progress
 */
export function resetProgress(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const data = getDefaultData();
    // Preserve settings if desired, or reset everything
    // For now, reset everything
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    logger.error('Error resetting progress:', error);
  }
}

/**
 * Update settings
 */
export function updateSettings(newSettings: Partial<UserSettings>): void {
  const data = getUserData();
  data.settings = {
    ...data.settings,
    ...newSettings,
  };
  saveUserData(data);
}

/**
 * Get settings
 */
export function getSettings(): UserSettings {
  const data = getUserData();
  return data.settings;
}

/**
 * Set user name
 */
export function setUserName(name: string): void {
  const data = getUserData();
  data.userName = name;
  saveUserData(data);
}

/**
 * Save selected age tier to journey state
 */
export function setSelectedAgeTier(ageTier: AgeTier): void {
  const data = getUserData();
  if (!data.journey) {
    data.journey = {};
  }
  data.journey.selectedAgeTier = ageTier;
  saveUserData(data);
}

/**
 * Get selected age tier from journey state
 */
export function getSelectedAgeTier(): AgeTier | undefined {
  const data = getUserData();
  return data.journey?.selectedAgeTier;
}

/**
 * Save selected service to journey state
 */
export function setSelectedService(service: Service): void {
  const data = getUserData();
  if (!data.journey) {
    data.journey = {};
  }
  data.journey.selectedService = service;
  saveUserData(data);
}

/**
 * Get selected service from journey state
 */
export function getSelectedService(): Service | undefined {
  const data = getUserData();
  return data.journey?.selectedService;
}

/**
 * Get full journey state
 */
export function getJourneyState(): JourneyState | undefined {
  const data = getUserData();
  return data.journey;
}

/**
 * Award a performance badge based on conversation score
 * Returns the badge if it was newly awarded, null if already owned
 */
export function awardScoreBadge(score: number): Badge | null {
  const badge = getBadgeForScore(score);
  if (!badge) {
    return null;
  }

  const data = getUserData();

  // Check if badge already exists
  const existingBadge = data.badges.find(b => b.id === badge.id);
  if (existingBadge) {
    return null; // Already have this badge
  }

  // Award the badge
  const badgeWithTimestamp = {
    ...badge,
    timestamp: new Date().toISOString(),
  };
  data.badges.push(badgeWithTimestamp);
  saveUserData(data);

  return badgeWithTimestamp;
}
