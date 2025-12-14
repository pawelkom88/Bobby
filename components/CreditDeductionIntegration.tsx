/**
 * Credit Deduction Integration Component
 * Wraps VoiceConversation with credit deduction logic
 * 
 * Flow:
 * 1. User starts conversation → Call /api/conversation/start
 * 2. User has conversation (client-side)
 * 3. User ends conversation → Call /api/conversation/end
 * 4. Conversation completes → Call /api/deduct-credits
 */

import React, { useEffect, useCallback, useState } from 'react';
import VoiceConversation from './VoiceConversation';
import { useCreditDeduction } from '@/hooks/useCreditDeduction';
import { useAuth } from '@/context/AuthContext';
import { useSetConversationComplete } from '@/hooks/mutations/useSessionMutations';
import { logger } from '@/lib/logger';
import type { AgeTier, Service, ConversationMessage } from '@/types';

interface CreditDeductionIntegrationProps {
  ageTier?: AgeTier;
  situation?: Service;
  onComplete?: (conversation: ConversationMessage[], conversationId: string) => void;
  onBack?: () => void;
  autoStart?: boolean;
  disableConnection?: boolean;
}

/**
 * Component that integrates credit deduction with VoiceConversation
 */
export default function CreditDeductionIntegration({
  ageTier = 1,
  situation = 'fire',
  onComplete,
  onBack,
  autoStart = false,
  disableConnection = false,
}: CreditDeductionIntegrationProps) {
  const { user } = useAuth();
  const { state, startConversation, endConversation, deductCredits, reset } =
    useCreditDeduction();
  const setConversationComplete = useSetConversationComplete();
  const [isInitialized, setIsInitialized] = useState(false);
  const [deductionError, setDeductionError] = useState<string | null>(null);

  /**
   * Initialize conversation when component mounts
   */
  useEffect(() => {
    if (!isInitialized && autoStart && user) {
      const initializeConversation = async () => {
        try {
          logger.log('Initializing conversation with credit tracking');
          const conversationId = await startConversation(ageTier, situation);

          if (!conversationId) {
            logger.error('Failed to initialize conversation');
            setDeductionError('Failed to start conversation tracking');
            return;
          }

          logger.log(`Conversation initialized: ${conversationId}`);
          setIsInitialized(true);
        } catch (error) {
          logger.error('Error initializing conversation:', error);
          setDeductionError('Failed to initialize conversation');
        }
      };

      initializeConversation();
    }
  }, [isInitialized, autoStart, user, ageTier, situation, startConversation]);

  /**
   * Handle conversation completion
   */
  const handleConversationComplete = useCallback(
    async (conversation: ConversationMessage[]) => {
      try {
        logger.log('Conversation completed, processing credit deduction');

        // CRITICAL: Mark conversation as complete BEFORE credit deduction
        // This ensures users can access completion page even with 0 credits
        if (user) {
          try {
            await setConversationComplete.mutateAsync(true);
            logger.log('Conversation marked as complete - granting 24-hour access');
          } catch (error) {
            logger.error('Failed to mark conversation as complete:', error);
          }
        }

        // 1. End the conversation (set endedAt timestamp and save messages)
        if (state.conversationId) {
          const endSuccess = await endConversation(state.conversationId, conversation);

          if (!endSuccess) {
            logger.warn('Failed to end conversation, but continuing with deduction');
          }

          // 2. Deduct credits (AFTER marking conversation complete)
          const deductSuccess = await deductCredits(state.conversationId);

          if (!deductSuccess) {
            logger.warn('Credit deduction not applied (may be expected)');
            // This is not necessarily an error - could be duration too short, already charged, etc.
          } else {
            logger.log('Credits deducted successfully');
          }
        }

        // 3. Call the original onComplete callback
        if (onComplete) {
          onComplete(conversation, state.conversationId || '');
        }
      } catch (error) {
        logger.error('Error processing conversation completion:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        setDeductionError(message);

        // Still call onComplete even if deduction fails
        if (onComplete) {
          onComplete(conversation, state.conversationId || '');
        }
      }
    },
    [state.conversationId, endConversation, deductCredits, onComplete, user, setConversationComplete]
  );

  /**
   * Handle back button
   */
  const handleBack = useCallback(() => {
    reset();
    setDeductionError(null);
    if (onBack) {
      onBack();
    }
  }, [reset, onBack]);

  return (
    <>
      {/* Show deduction error if any */}
      {deductionError && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
          role="alert"
        >
          <p className="text-red-800 text-sm">
            <strong>Credit Deduction Error:</strong> {deductionError}
          </p>
        </div>
      )}

      {/* Show loading state while processing */}
      {state.isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm">
            Processing conversation...
          </p>
        </div>
      )}

      {/* Show credit deduction result */}
      {state.charged && state.newCredits !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 text-sm">
            ✅ 1 credit deducted. Remaining credits: <strong>{state.newCredits}</strong>
          </p>
        </div>
      )}

      {/* Render VoiceConversation with integrated handlers */}
      <VoiceConversation
        ageTier={ageTier}
        situation={situation}
        onComplete={handleConversationComplete}
        onBack={handleBack}
        autoStart={autoStart}
        disableConnection={disableConnection}
      />
    </>
  );
}
