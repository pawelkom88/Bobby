'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  getUserData,
  initializeUserData,
  saveUserData,
  saveConversation as firestoreSaveConversation,
  addXP as firestoreAddXP,
  updateSettings as firestoreUpdateSettings,
  setUserName as firestoreSetUserName,
  setSelectedAgeTier as firestoreSetSelectedAgeTier,
  setSelectedService as firestoreSetSelectedService,
  awardScoreBadge as firestoreAwardScoreBadge,
  resetProgress as firestoreResetProgress,
  subscribeToUserData,
  getDefaultUserData,
} from '@/lib/firestore-storage';
import type {
  UserData,
  UserSettings,
  Service,
  AgeTier,
  Badge,
  LevelUpResult,
  JourneyState,
  Conversation,
} from '@/types';
import { logger } from '@/lib/logger';

interface UserDataContextType {
  userData: UserData;
  loading: boolean;
  
  // User data operations
  saveConversation: (
    timestamp: string,
    service: Service,
    ageTier: AgeTier,
    xpEarned: number,
    score?: number,
    feedback?: string[]
  ) => Promise<void>;
  addXP: (amount: number) => Promise<LevelUpResult>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  setSelectedAgeTier: (ageTier: AgeTier) => Promise<void>;
  setSelectedService: (service: Service) => Promise<void>;
  awardScoreBadge: (score: number) => Promise<Badge | null>;
  resetProgress: () => Promise<void>;
  
  // Getters (derived from userData state)
  getLevel: () => number;
  getXP: () => number;
  getBadges: () => Badge[];
  getConversations: () => Conversation[];
  getSettings: () => UserSettings;
  getJourneyState: () => JourneyState | undefined;
  getUserProgress: () => {
    level: number;
    totalXP: number;
    xpToNextLevel: number;
    badges: Badge[];
    conversations: Conversation[];
    userName: string;
  };
}

const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined
);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData>(getDefaultUserData());
  const [loading, setLoading] = useState(true);

  // Initialize and subscribe to user data when user is authenticated
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      // User is not authenticated, use default data
      setUserData(getDefaultUserData());
      setLoading(false);
      return;
    }

    // Initialize user document if it doesn't exist
    const initUser = async () => {
      try {
        await initializeUserData(user.uid);
      } catch (error) {
        logger.error('Error initializing user data:', error);
      }
    };

    initUser();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserData(user.uid, (data) => {
      setUserData(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, authLoading]);

  // Wrapper functions that use the current user's UID
  const saveConversation = useCallback(
    async (
      timestamp: string,
      service: Service,
      ageTier: AgeTier,
      xpEarned: number,
      score?: number,
      feedback?: string[]
    ) => {
      if (!user) {
        throw new Error('User must be authenticated to save conversation');
      }
      await firestoreSaveConversation(
        user.uid,
        timestamp,
        service,
        ageTier,
        xpEarned,
        score,
        feedback
      );
    },
    [user]
  );

  const addXP = useCallback(
    async (amount: number): Promise<LevelUpResult> => {
      if (!user) {
        throw new Error('User must be authenticated to add XP');
      }
      return await firestoreAddXP(user.uid, amount);
    },
    [user]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!user) {
        throw new Error('User must be authenticated to update settings');
      }
      await firestoreUpdateSettings(user.uid, newSettings);
    },
    [user]
  );

  const setUserName = useCallback(
    async (name: string) => {
      if (!user) {
        throw new Error('User must be authenticated to set user name');
      }
      await firestoreSetUserName(user.uid, name);
    },
    [user]
  );

  const setSelectedAgeTier = useCallback(
    async (ageTier: AgeTier) => {
      if (!user) {
        throw new Error('User must be authenticated to set age tier');
      }
      await firestoreSetSelectedAgeTier(user.uid, ageTier);
    },
    [user]
  );

  const setSelectedService = useCallback(
    async (service: Service) => {
      if (!user) {
        throw new Error('User must be authenticated to set service');
      }
      await firestoreSetSelectedService(user.uid, service);
    },
    [user]
  );

  const awardScoreBadge = useCallback(
    async (score: number): Promise<Badge | null> => {
      if (!user) {
        throw new Error('User must be authenticated to award badge');
      }
      return await firestoreAwardScoreBadge(user.uid, score);
    },
    [user]
  );

  const resetProgress = useCallback(async () => {
    if (!user) {
      throw new Error('User must be authenticated to reset progress');
    }
    await firestoreResetProgress(user.uid);
  }, [user]);

  // Getter functions that derive from current state
  const getLevel = useCallback(() => userData.level, [userData.level]);
  const getXP = useCallback(() => userData.totalXP, [userData.totalXP]);
  const getBadges = useCallback(() => userData.badges, [userData.badges]);
  const getConversations = useCallback(
    () => userData.conversations,
    [userData.conversations]
  );
  const getSettings = useCallback(
    () => userData.settings,
    [userData.settings]
  );
  const getJourneyState = useCallback(
    () => userData.journey,
    [userData.journey]
  );

  const getUserProgress = useCallback(() => {
    // Calculate XP to next level
    const levelRanges = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
    const currentLevelEnd = levelRanges[userData.level] || 2700;
    const xpToNextLevel = Math.max(0, currentLevelEnd - userData.totalXP);

    return {
      level: userData.level,
      totalXP: userData.totalXP,
      xpToNextLevel,
      badges: userData.badges,
      conversations: userData.conversations,
      userName: userData.userName,
    };
  }, [userData]);

  const value: UserDataContextType = {
    userData,
    loading,
    saveConversation,
    addXP,
    updateSettings,
    setUserName,
    setSelectedAgeTier,
    setSelectedService,
    awardScoreBadge,
    resetProgress,
    getLevel,
    getXP,
    getBadges,
    getConversations,
    getSettings,
    getJourneyState,
    getUserProgress,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

/**
 * Hook to use user data context
 */
export function useUserData(): UserDataContextType {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}

