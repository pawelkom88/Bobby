import { z } from 'zod';

/**
 * Conversation API schemas
 */
export const StartConversationRequestSchema = z.object({
  ageTier: z.enum(['young', 'teen', 'adult']),
  situation: z.string(),
});

export const StartConversationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    conversationId: z.string(),
    startedAt: z.string().datetime(),
  }).optional(),
  error: z.string().optional(),
});

export const EndConversationRequestSchema = z.object({
  conversationId: z.string(),
});

export const EndConversationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    endedAt: z.string().datetime(),
    durationSeconds: z.number(),
  }).optional(),
  error: z.string().optional(),
});

export const DeductCreditsRequestSchema = z.object({
  conversationId: z.string(),
  durationSeconds: z.number(),
});

export const DeductCreditsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    creditsDeducted: z.number(),
    remainingCredits: z.number(),
  }).optional(),
  error: z.string().optional(),
});

/**
 * Type exports
 */
export type StartConversationRequest = z.infer<typeof StartConversationRequestSchema>;
export type StartConversationResponse = z.infer<typeof StartConversationResponseSchema>;
export type EndConversationRequest = z.infer<typeof EndConversationRequestSchema>;
export type EndConversationResponse = z.infer<typeof EndConversationResponseSchema>;
export type DeductCreditsRequest = z.infer<typeof DeductCreditsRequestSchema>;
export type DeductCreditsResponse = z.infer<typeof DeductCreditsResponseSchema>;
