'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  initializeUserData,
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

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setUserData(getDefaultUserData());
      setLoading(false);
      return;
    }

    const initUser = async () => {
      try {
        await initializeUserData(user.uid);
      } catch (error) {
        logger.error('Error initializing user data:', error);
      }
    };

    initUser();

    const unsubscribe = subscribeToUserData(user.uid, (data) => {
      setUserData(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, authLoading]);

  const saveConversation = async (
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
  };

  const addXP = async (amount: number): Promise<LevelUpResult> => {
    if (!user) {
      throw new Error('User must be authenticated to add XP');
    }
    return await firestoreAddXP(user.uid, amount);
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) {
      throw new Error('User must be authenticated to update settings');
    }
    await firestoreUpdateSettings(user.uid, newSettings);
  };

  const setUserName = async (name: string) => {
    if (!user) {
      throw new Error('User must be authenticated to set user name');
    }
    await firestoreSetUserName(user.uid, name);
  };

  const setSelectedAgeTier = async (ageTier: AgeTier) => {
    if (!user) {
      throw new Error('User must be authenticated to set age tier');
    }
    await firestoreSetSelectedAgeTier(user.uid, ageTier);
  };

  const setSelectedService = async (service: Service) => {
    if (!user) {
      throw new Error('User must be authenticated to set service');
    }
    await firestoreSetSelectedService(user.uid, service);
  };

  const awardScoreBadge = async (score: number): Promise<Badge | null> => {
    if (!user) {
      throw new Error('User must be authenticated to award badge');
    }
    return await firestoreAwardScoreBadge(user.uid, score);
  };

  const resetProgress = async () => {
    if (!user) {
      throw new Error('User must be authenticated to reset progress');
    }
    await firestoreResetProgress(user.uid);
  };

  const getLevel = () => userData.level;
  const getXP = () => userData.totalXP;
  const getBadges = () => userData.badges;
  const getConversations = () => userData.conversations;
  const getSettings = () => userData.settings;
  const getJourneyState = () => userData.journey;

  const getUserProgress = () => {
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
  };

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

export function useUserData(): UserDataContextType {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}

