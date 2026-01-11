'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { createCheckoutSession } from '@/lib/api/checkout';
import type { CheckoutSessionParams } from '@/lib/api/checkout';
import type { CheckoutSessionResponse } from '@/schemas/checkout.schema';

export function useCheckoutSession() {
  const { user } = useAuth();

  return useMutation<CheckoutSessionResponse, Error, CheckoutSessionParams>({
    mutationFn: async (params: CheckoutSessionParams) => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      const token = await user.getIdToken(true);
      return createCheckoutSession(params, token);
    },
  });
}
