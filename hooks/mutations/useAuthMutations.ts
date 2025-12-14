'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchWithValidation } from '@/lib/fetcher';
import { 
  ResetPasswordRequestSchema,
  ResetPasswordResponseSchema,
  type ResetPasswordRequest
} from '@/schemas/auth.schema';
import { logger } from '@/lib/logger';

/**
 * Query key factory for auth-related queries
 */
export const authKeys = {
  all: ['auth'] as const,
  passwordReset: () => [...authKeys.all, 'password-reset'] as const,
};

/**
 * Mutation to reset password
 */
export function useResetPassword() {
  const { signOut } = useAuth();
  
  return useMutation({
    mutationFn: async (email: string) => {
      const request: ResetPasswordRequest = {
        email,
      };
      
      const response = await fetchWithValidation(
        '/api/auth/reset-password',
        ResetPasswordResponseSchema,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to send reset email');
      }
      
      return response;
    },
    onSuccess: (_, email) => {
      logger.info(`Password reset email sent to: ${email}`);
    },
    onError: (error) => {
      logger.error('Password reset failed:', error);
    },
  });
}

/**
 * Mutation to sign out with optional redirect
 */
export function useSignOut() {
  const { signOut: firebaseSignOut } = useAuth();
  
  return useMutation({
    mutationFn: async (options?: { redirect?: string }) => {
      await firebaseSignOut();
      
      if (options?.redirect) {
        window.location.href = options.redirect;
      }
      
      return true;
    },
    onError: (error) => {
      logger.error('Sign out failed:', error);
    },
  });
}
