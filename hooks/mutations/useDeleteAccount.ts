'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { deleteAccount } from '@/lib/api/account';

export function useDeleteAccount() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      const token = await user.getIdToken();
      return deleteAccount(token);
    },
  });
}
