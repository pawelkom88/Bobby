/**
 * Firestore User Data Management
 * 
 * This module handles all user-related Firestore operations.
 * User documents are stored in the "users" collection with the user's uid as the document ID.
 * 
 * Collection Structure:
 * users/
 *   {uid}/
 *     - email: string
 *     - displayName: string | null
 *     - photoURL: string | null
 *     - createdAt: Timestamp
 *     - lastLogin: Timestamp
 *     - updatedAt: Timestamp
 *     - progress: object (optional)
 *     - achievements: array (optional)
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

export interface UserData {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: any;
  lastLogin?: any;
  updatedAt?: any;
  progress?: Record<string, any>;
  achievements?: string[];
}

/**
 * Get user data from Firestore
 * @param userId - The user's uid
 * @returns User data or null if not found
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    } else {
      logger.warn('User document not found:', userId);
      return null;
    }
  } catch (error) {
    logger.error('Error getting user data:', error);
    throw error;
  }
}

/**
 * Create a new user document in Firestore
 * @param userId - The user's uid
 * @param userData - Initial user data
 */
export async function createUserDocument(userId: string, userData: Partial<UserData>): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const newUserData = {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(userDocRef, newUserData);
    logger.info('User document created:', userId);
  } catch (error) {
    logger.error('Error creating user document:', error);
    throw error;
  }
}

/**
 * Update user data in Firestore
 * @param userId - The user's uid
 * @param updates - Fields to update
 */
export async function updateUserData(userId: string, updates: Partial<UserData>): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userDocRef, updateData);
    logger.info('User data updated:', userId);
  } catch (error) {
    logger.error('Error updating user data:', error);
    throw error;
  }
}

/**
 * Update user's last login timestamp
 * @param userId - The user's uid
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    logger.info('Last login updated:', userId);
  } catch (error) {
    logger.error('Error updating last login:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Save user progress to Firestore
 * @param userId - The user's uid
 * @param progress - Progress data to save
 */
export async function saveUserProgress(userId: string, progress: Record<string, any>): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      progress,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    logger.info('User progress saved:', userId);
  } catch (error) {
    logger.error('Error saving user progress:', error);
    throw error;
  }
}

/**
 * Add achievement to user's achievements array
 * @param userId - The user's uid
 * @param achievementId - Achievement ID to add
 */
export async function addUserAchievement(userId: string, achievementId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const achievements = userData.achievements || [];
      
      // Only add if not already present
      if (!achievements.includes(achievementId)) {
        achievements.push(achievementId);
        await updateDoc(userDocRef, {
          achievements,
          updatedAt: serverTimestamp(),
        });
        logger.info('Achievement added:', achievementId);
      }
    }
  } catch (error) {
    logger.error('Error adding achievement:', error);
    throw error;
  }
}

/**
 * Get user's achievements
 * @param userId - The user's uid
 * @returns Array of achievement IDs
 */
export async function getUserAchievements(userId: string): Promise<string[]> {
  try {
    const userData = await getUserData(userId);
    return userData?.achievements || [];
  } catch (error) {
    logger.error('Error getting user achievements:', error);
    return [];
  }
}

/**
 * Sync local storage data to Firestore
 * Useful for migrating existing local data to cloud
 * @param userId - The user's uid
 * @param localData - Local storage data to sync
 */
export async function syncLocalDataToFirestore(
  userId: string,
  localData: Record<string, any>
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...localData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    logger.info('Local data synced to Firestore:', userId);
  } catch (error) {
    logger.error('Error syncing local data:', error);
    throw error;
  }
}
