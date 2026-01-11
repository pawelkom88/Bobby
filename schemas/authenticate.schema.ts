import { z } from 'zod';

export const DeepgramTokenResponseSchema = z
  .object({
    access_token: z.string(),
    expires_in: z.number().optional(),
    token_type: z.string().optional(),
  })
  .passthrough();

export type DeepgramTokenResponse = z.infer<
  typeof DeepgramTokenResponseSchema
>;
