/**
 * Firestore storage utilities for user data, progress, and settings
 * This replaces localStorage with Cloud Firestore for authenticated users
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import {
  calculateLevel,
  getBadgeForLevel,
  getBadgeForScore,
  getBadgeForFirstCall,
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
} from '@/types';

/**
 * Get default data structure for new users
 */
export function getDefaultUserData(): UserData {
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
 * Get user data from Firestore
 * @param userId - The authenticated user's UID
 * @returns User data or default data if not found
 */
export async function getUserData(userId: string): Promise<UserData> {
  try {
    logger.log('🔍 📖 READING USER DATA FROM FIRESTORE');
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      // Ensure all required fields exist with defaults
      const userData = {
        ...getDefaultUserData(),
        ...data,
      } as UserData;
      logger.log('🔍 📖 USER DATA READ:', {
        totalXP: userData.totalXP,
        level: userData.level,
        badges: userData.badges.length,
        conversations: userData.conversations.length,
      });
      return userData;
    } else {
      logger.log('🔍 ⚠️ USER DOCUMENT NOT FOUND, RETURNING DEFAULTS');
      logger.info('User document not found, returning defaults:', userId);
      return getDefaultUserData();
    }
  } catch (error) {
    logger.log('🔍 ❌ ERROR READING USER DATA:', error);
    logger.error('Error getting user data from Firestore:', error);
    return getDefaultUserData();
  }
}

/**
 * Initialize user document in Firestore if it doesn't exist
 * @param userId - The authenticated user's UID
 * @param initialData - Optional initial data to merge with defaults
 */
export async function initializeUserData(
  userId: string,
  initialData?: Partial<UserData>
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const defaultData = getDefaultUserData();
      const userData = {
        ...defaultData,
        ...initialData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);
      logger.info('User document initialized in Firestore:', userId);
    }
  } catch (error) {
    logger.error('Error initializing user document:', error);
    throw error;
  }
}

/**
 * Save complete user data to Firestore
 * @param userId - The authenticated user's UID
 * @param data - Complete user data object
 */
export async function saveUserData(
  userId: string,
  data: UserData
): Promise<void> {
  try {
    logger.log('🔍 💾 SAVING USER DATA TO FIRESTORE:', {
      totalXP: data.totalXP,
      level: data.level,
      badges: data.badges.length,
      conversations: data.conversations.length,
    });
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    logger.log('🔍 ✅ USER DATA SAVED TO FIRESTORE');
    logger.info('User data saved to Firestore:', userId);
  } catch (error) {
    logger.log('🔍 ❌ ERROR SAVING USER DATA:', error);
    logger.error('Error saving user data to Firestore:', error);
    throw error;
  }
}

/**
 * Save a conversation to Firestore
 */
export async function saveConversation(
  userId: string,
  timestamp: string,
  service: Service,
  ageTier: AgeTier,
  xpEarned: number,
  score?: number,
  feedback?: string[],
  conversationId?: string
): Promise<void> {
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

  try {
    const data = await getUserData(userId);
    const conversationEntry: Conversation = {
      timestamp,
      service,
      ageTier,
      xpEarned,
      ...(typeof score === 'number' ? { score } : {}),
      ...(feedback && feedback.length ? { feedback } : {}),
      ...(conversationId ? { conversationId } : {}),
    };

    data.conversations.push(conversationEntry);

    // Award "First Call Hero" badge if this is the first conversation
    if (data.conversations.length === 1) {
      logger.log('🔍 🎉 FIRST CONVERSATION! Awarding First Call Hero badge');
      const firstCallBadge = getBadgeForFirstCall();
      const existingBadge = data.badges.find(b => b.id === firstCallBadge.id);
      if (!existingBadge) {
        const badgeWithTimestamp = {
          ...firstCallBadge,
          timestamp: new Date().toISOString(),
        };
        data.badges.push(badgeWithTimestamp);
        logger.log('🔍 ✅ First Call Hero badge awarded!');
      }
    }

    await saveUserData(userId, data);
  } catch (error) {
    logger.error('Error saving conversation:', error);
    throw error;
  }
}

/**
 * Add XP and check for level up
 */
export async function addXP(
  userId: string,
  amount: number
): Promise<LevelUpResult> {
  logger.log('🔍 ===== ADD XP FUNCTION =====');
  logger.log('🔍 userId:', userId);
  logger.log('🔍 amount:', amount);

  // Validate XP amount
  if (!validateXP(amount)) {
    logger.log('🔍 ❌ Invalid XP amount:', amount);
    logger.error('Invalid XP amount:', amount);
    const data = await getUserData(userId);
    return {
      newLevel: data.level,
      leveledUp: false,
      badgeAwarded: null,
      totalXP: data.totalXP,
    };
  }

  try {
    const data = await getUserData(userId);
    logger.log('🔍 Current user data:', {
      totalXP: data.totalXP,
      level: data.level,
      badges: data.badges.length,
    });

    const oldLevel = data.level;
    const oldTotalXP = data.totalXP;
    data.totalXP = Math.max(0, data.totalXP + amount);
    data.level = calculateLevel(data.totalXP);
    const newLevel = data.level;
    const leveledUp = newLevel > oldLevel;

    logger.log('🔍 After XP calculation:', {
      oldTotalXP,
      newTotalXP: data.totalXP,
      oldLevel,
      newLevel,
      leveledUp,
    });

    let badgeAwarded: Badge | null = null;
    if (leveledUp) {
      const badge = getBadgeForLevel(newLevel);
      if (badge) {
        const existingBadge = data.badges.find(b => b.id === badge.id);
        if (!existingBadge) {
          badgeAwarded = {
            ...badge,
            timestamp: new Date().toISOString(),
          };
          data.badges.push(badgeAwarded);
          logger.log('🔍 ✅ Badge awarded:', badgeAwarded.name);
        }
      }
    }

    logger.log('🔍 Saving user data to Firestore...');
    await saveUserData(userId, data);
    logger.log('🔍 ✅ User data saved successfully');

    const result = {
      newLevel,
      leveledUp,
      badgeAwarded,
      totalXP: data.totalXP,
    };
    logger.log('🔍 Returning result:', result);

    return result;
  } catch (error) {
    logger.log('🔍 ❌ Error in addXP:', error);
    logger.error('Error adding XP:', error);
    throw error;
  }
}

/**
 * Update user settings
 */
export async function updateSettings(
  userId: string,
  newSettings: Partial<UserSettings>
): Promise<void> {
  try {
    const data = await getUserData(userId);
    data.settings = {
      ...data.settings,
      ...newSettings,
    };
    await saveUserData(userId, data);
  } catch (error) {
    logger.error('Error updating settings:', error);
    throw error;
  }
}

/**
 * Set user name
 */
export async function setUserName(userId: string, name: string): Promise<void> {
  try {
    const data = await getUserData(userId);
    data.userName = name;
    await saveUserData(userId, data);
  } catch (error) {
    logger.error('Error setting user name:', error);
    throw error;
  }
}

/**
 * Save selected age tier to journey state
 */
export async function setSelectedAgeTier(
  userId: string,
  ageTier: AgeTier
): Promise<void> {
  try {
    const data = await getUserData(userId);
    if (!data.journey) {
      data.journey = {};
    }
    data.journey.selectedAgeTier = ageTier;
    await saveUserData(userId, data);
  } catch (error) {
    logger.error('Error setting selected age tier:', error);
    throw error;
  }
}

/**
 * Save selected service to journey state
 */
export async function setSelectedService(
  userId: string,
  service: Service
): Promise<void> {
  try {
    const data = await getUserData(userId);
    if (!data.journey) {
      data.journey = {};
    }
    data.journey.selectedService = service;
    await saveUserData(userId, data);
  } catch (error) {
    logger.error('Error setting selected service:', error);
    throw error;
  }
}

/**
 * Award a performance badge based on conversation score
 * Returns the badge if it was newly awarded, null if already owned
 */
export async function awardScoreBadge(
  userId: string,
  score: number
): Promise<Badge | null> {
  logger.log('🔍 ===== AWARD SCORE BADGE =====');
  logger.log('🔍 userId:', userId);
  logger.log('🔍 score:', score);

  const badge = getBadgeForScore(score);
  logger.log('🔍 Badge for score:', badge?.name || 'none');

  if (!badge) {
    logger.log('🔍 No badge for this score');
    return null;
  }

  try {
    const data = await getUserData(userId);
    logger.log(
      '🔍 Current badges:',
      data.badges.map(b => b.name)
    );

    // Check if badge already exists
    const existingBadge = data.badges.find(b => b.id === badge.id);
    if (existingBadge) {
      logger.log('🔍 Badge already owned:', badge.name);
      return null; // Already have this badge
    }

    // Award the badge
    const badgeWithTimestamp = {
      ...badge,
      timestamp: new Date().toISOString(),
    };
    data.badges.push(badgeWithTimestamp);
    logger.log('🔍 Awarding badge:', badge.name);
    await saveUserData(userId, data);
    logger.log('🔍 ✅ Badge saved successfully');

    return badgeWithTimestamp;
  } catch (error) {
    logger.log('🔍 ❌ Error awarding badge:', error);
    logger.error('Error awarding score badge:', error);
    throw error;
  }
}

/**
 * Reset all progress (keeps settings)
 */
export async function resetProgress(userId: string): Promise<void> {
  try {
    const data = await getUserData(userId);
    const defaultData = getDefaultUserData();

    // Preserve settings but reset everything else
    const resetData: UserData = {
      ...defaultData,
      settings: data.settings, // Keep user's accessibility settings
    };

    await saveUserData(userId, resetData);
    logger.info('User progress reset:', userId);
  } catch (error) {
    logger.error('Error resetting progress:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time user data updates
 * @param userId - The authenticated user's UID
 * @param callback - Function to call when data changes
 * @returns Unsubscribe function
 */
export function subscribeToUserData(
  userId: string,
  callback: (data: UserData) => void
): Unsubscribe {
  const userDocRef = doc(db, 'users', userId);

  return onSnapshot(
    userDocRef,
    snapshot => {
      if (snapshot.exists()) {
        const data = {
          ...getDefaultUserData(),
          ...snapshot.data(),
        } as UserData;
        callback(data);
      } else {
        callback(getDefaultUserData());
      }
    },
    error => {
      logger.error('Error in user data subscription:', error);
      callback(getDefaultUserData());
    }
  );
}
