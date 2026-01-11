import { z } from 'zod';

export const DeleteAccountResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
  retryAfter: z.number().optional(),
});

export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;
