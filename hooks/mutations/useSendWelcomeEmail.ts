'use client';

import { useMutation } from '@tanstack/react-query';
import { sendWelcomeEmail } from '@/lib/api/emails';

interface SendWelcomeEmailParams {
  token: string;
  name?: string;
}

export function useSendWelcomeEmail() {
  return useMutation({
    mutationFn: async ({ token, name }: SendWelcomeEmailParams) => {
      return sendWelcomeEmail(token, name);
    },
  });
}
