import { z } from 'zod';

export const WelcomeEmailResponseSchema = z.object({
  success: z.boolean().optional(),
  alreadySent: z.boolean().optional(),
  error: z.string().optional(),
  retryAfter: z.number().optional(),
});

export type WelcomeEmailResponse = z.infer<
  typeof WelcomeEmailResponseSchema
>;
