/**
 * localStorage utilities for user data, progress, and settings
 */

import {
  calculateLevel,
  getXPToNextLevel,
  getBadgeForLevel,
} from './gamification';
import type { UserData, UserSettings, Conversation, Service, AgeTier, Badge, LevelUpResult } from '@/types';

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
    console.error('Error reading from localStorage:', error);
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
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Save a conversation
 */
export function saveConversation(
  timestamp: string,
  service: Service,
  ageTier: AgeTier,
  xpEarned: number
): void {
  const data = getUserData();
  data.conversations.push({
    timestamp,
    service,
    ageTier,
    xpEarned,
  });
  saveUserData(data);
}

/**
 * Add XP and check for level up
 */
export function addXP(amount: number): LevelUpResult {
  const data = getUserData();
  const oldLevel = data.level;
  data.totalXP += amount;
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
    console.error('Error resetting progress:', error);
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

