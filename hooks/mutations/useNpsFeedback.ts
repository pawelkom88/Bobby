'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { submitNpsFeedback } from '@/lib/api/feedback';
import type { NpsFeedbackRequest } from '@/schemas/feedback.schema';

export function useNpsFeedback() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: NpsFeedbackRequest) => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      const token = await user.getIdToken();
      return submitNpsFeedback(data, token);
    },
  });
}
