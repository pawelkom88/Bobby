import { z } from 'zod';

/**
 * Authentication request/response schemas
 */
export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
});

export const ResetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

/**
 * User profile schema (from Firebase Auth)
 */
export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  photoURL: z.string().nullable(),
  emailVerified: z.boolean(),
});

/**
 * Type exports
 */
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
