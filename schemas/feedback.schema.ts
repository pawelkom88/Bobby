import { z } from 'zod';

export const NpsFeedbackRequestSchema = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().optional(),
  conversationId: z.string().optional(),
});

export const FeedbackResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
  retryAfter: z.number().optional(),
});

export const BetaFeedbackResponseSchema = z.object({
  success: z.boolean(),
  feedbackId: z.string().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  retryAfter: z.number().optional(),
});

export type NpsFeedbackRequest = z.infer<typeof NpsFeedbackRequestSchema>;
export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;
export type BetaFeedbackResponse = z.infer<typeof BetaFeedbackResponseSchema>;
