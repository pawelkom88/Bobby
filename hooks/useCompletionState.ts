'use client';

import { useState, useEffect } from 'react';
import { useUserData } from '@/context/UserDataContext';
import { useSession } from '@/hooks/queries/useSession';
import { calculateXPEarned } from '@/lib/gamification';
import { playFanfareSound } from '@/lib/uiSound';
import type { Service, AgeTier, PerformanceMetrics, Badge, ConversationAssessment } from '@/types';
import { logger } from '@/lib/logger';

interface CompletionState {
  showConfetti: boolean;
  xpEarned: number;
  leveledUp: boolean;
  badgeAwarded: Badge | null;
  scoreBadgeAwarded: Badge | null;
  currentLevel: number;
  isLevel10: boolean;
  assessment: ConversationAssessment | undefined;
  feedbackSummary: string[];
}

interface UseCompletionStateProps {
  service?: Service;
  ageTier?: AgeTier;
  performance?: PerformanceMetrics;
}

/**
 * Custom hook that manages all completion screen state and logic.
 * Handles XP calculation, badge awards, level ups, and conversation saving.
 */
export function useCompletionState({
  service,
  ageTier,
  performance = {},
}: UseCompletionStateProps): CompletionState {
  const { addXP, saveConversation, awardScoreBadge, getLevel } = useUserData();
  const { data: sessionData } = useSession();

  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXPEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [badgeAwarded, setBadgeAwarded] = useState<Badge | null>(null);
  const [scoreBadgeAwarded, setScoreBadgeAwarded] = useState<Badge | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLevel10, setIsLevel10] = useState(false);

  const assessment = performance.assessment;
  const feedbackSummary = getFeedbackSummary(assessment);

  useEffect(() => {
    void processCompletion();
  }, [service, ageTier, performance.assessment, sessionData]);

  async function processCompletion() {
    const completionId = sessionData?.completionId;
    const processedId = sessionData?.processedCompletionId;
    const assessmentData = sessionData?.lastAssessment;

    logCompletionDebug({ completionId, processedId, service, ageTier, performance });

    // Wait for assessment data before processing
    if (!performance.assessment) {
      logger.log('🔍 ⏳ WAITING: No assessment in performance yet, skipping this render');
      return;
    }

    // Handle page refresh - skip XP award but show results
    if (assessmentData && !completionId) {
      logger.log('🔍 ❌ PATH 1: Page refresh detected, skipping XP award');
      setXPEarned(calculateXPEarned(performance));
      setCurrentLevel(getLevel());
      return;
    }

    // Skip if already processed or invalid
    if (!completionId || completionId === processedId) {
      logger.log('🔍 ❌ PATH 2: Completion already processed or invalid');
      setXPEarned(calculateXPEarned(performance));
      setCurrentLevel(getLevel());
      return;
    }

    // Process new completion
    logger.log('🔍 ✅ PATH 3: Awarding XP for new completion');
    await awardCompletionRewards();
  }

  async function awardCompletionRewards() {
    const xp = calculateXPEarned(performance);
    setXPEarned(xp);

    if (xp > 0) {
      setShowConfetti(true);
      playFanfareSound(true).catch(() => {});
    }

    try {
      // Step 1: Award XP and handle level up
      const result = await addXP(xp);
      setLeveledUp(result.leveledUp);
      setBadgeAwarded(result.badgeAwarded);
      setCurrentLevel(result.newLevel);
      setIsLevel10(result.newLevel === 10);

      // Step 2: Award score-based badge
      if (assessment?.score) {
        const scoreBadge = await awardScoreBadge(assessment.score);
        if (scoreBadge) setScoreBadgeAwarded(scoreBadge);
      }

      // Step 3: Save conversation
      if (service && ageTier) {
        await saveConversation(
          new Date().toISOString(),
          service,
          ageTier,
          xp,
          assessment?.score,
          feedbackSummary.slice(0, 3),
          sessionData?.conversationId
        );
      }
    } catch (error) {
      logger.error('Error in completion flow:', error);
    }
  }

  return {
    showConfetti,
    xpEarned,
    leveledUp,
    badgeAwarded,
    scoreBadgeAwarded,
    currentLevel,
    isLevel10,
    assessment,
    feedbackSummary,
  };
}

function getFeedbackSummary(assessment: ConversationAssessment | undefined): string[] {
  if (!assessment) return [];
  if (assessment.improvements.length > 0) return assessment.improvements;
  return assessment.positives ?? [];
}

function logCompletionDebug(data: {
  completionId?: string;
  processedId?: string;
  service?: Service;
  ageTier?: AgeTier;
  performance: PerformanceMetrics;
}) {
  logger.log('🔍 ===== COMPLETION SCREEN USEEFFECT =====');
  logger.log('🔍 completionId:', data.completionId);
  logger.log('🔍 processedId:', data.processedId);
  logger.log('🔍 service:', data.service);
  logger.log('🔍 ageTier:', data.ageTier);
  logger.log('🔍 performance.assessment:', data.performance.assessment);
}
