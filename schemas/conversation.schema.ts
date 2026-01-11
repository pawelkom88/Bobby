import { z } from 'zod';

/**
 * Conversation API schemas
 */
export const StartConversationRequestSchema = z.object({
  ageTier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  service: z.enum(['fire', 'ambulance', 'police']),
});

export const StartConversationResponseSchema = z.object({
  conversationId: z.string(),
  startedAt: z.string(),
  status: z.string(),
  error: z.string().optional(),
  message: z.string().optional(),
  retryAfter: z.number().optional(),
});

export const EndConversationRequestSchema = z.object({
  conversationId: z.string(),
  messages: z
    .array(
      z.object({
        type: z.enum(['user', 'agent']),
        text: z.string(),
        timestamp: z.string().optional(),
      })
    )
    .optional(),
});

export const EndConversationResponseSchema = z.object({
  conversationId: z.string(),
  endedAt: z.string(),
  status: z.string(),
  error: z.string().optional(),
  message: z.string().optional(),
  retryAfter: z.number().optional(),
});

export const DeductCreditsRequestSchema = z.object({
  conversationId: z.string(),
});

export const DeductCreditsResponseSchema = z.object({
  success: z.boolean(),
  newCredits: z.number().optional(),
  newBetaCredits: z.number().optional(),
  charged: z.boolean().optional(),
  durationSeconds: z.number().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  retryAfter: z.number().optional(),
  isBetaUser: z.boolean().optional(),
});

/**
 * Type exports
 */
export type StartConversationRequest = z.infer<
  typeof StartConversationRequestSchema
>;
export type StartConversationResponse = z.infer<
  typeof StartConversationResponseSchema
>;
export type EndConversationRequest = z.infer<typeof EndConversationRequestSchema>;
export type EndConversationResponse = z.infer<
  typeof EndConversationResponseSchema
>;
export type DeductCreditsRequest = z.infer<
  typeof DeductCreditsRequestSchema
>;
export type DeductCreditsResponse = z.infer<
  typeof DeductCreditsResponseSchema
>;
