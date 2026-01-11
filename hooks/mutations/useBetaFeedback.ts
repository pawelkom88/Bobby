'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { submitBetaFeedback } from '@/lib/api/feedback';
import type { BetaFeedbackData } from '@/lib/schemas/beta-feedback';

export function useBetaFeedback() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: BetaFeedbackData) => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      const token = await user.getIdToken();
      return submitBetaFeedback(data, token);
    },
  });
}
