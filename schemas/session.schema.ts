import { z } from 'zod';

/**
 * Assessment data structure (from session-storage)
 */
export const AssessmentDataSchema = z.object({
  assessment: z.object({
    score: z.number(),
    passed: z.boolean(),
    positives: z.array(z.string()),
    improvements: z.array(z.string()),
    warnings: z.array(z.string()),
    metrics: z.object({
      userTurns: z.number(),
      durationSeconds: z.number(),
    }),
  }),
  passed: z.boolean(),
  responses: z.array(z.any()).optional(),
  scores: z.array(z.number()).optional(),
  feedback: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Session data structure
 */
export const SessionDataSchema = z.object({
  assessment: AssessmentDataSchema.optional(),
  completionId: z.string().optional(),
  processedCompletionId: z.string().optional(),
  conversationId: z.string().optional(),
  isComplete: z.boolean().optional(),
  conversationComplete: z.boolean().optional(),
  expiresAt: z.union([z.string(), z.number()]).optional(),
  userId: z.string().optional(),
  lastAssessment: z.object({
    assessment: z.object({
      score: z.number(),
      passed: z.boolean(),
      positives: z.array(z.string()),
      improvements: z.array(z.string()),
      warnings: z.array(z.string()),
      metrics: z.object({
        userTurns: z.number(),
        durationSeconds: z.number(),
      }),
    }),
    passed: z.boolean(),
    responses: z.array(z.any()).optional(),
    scores: z.array(z.number()).optional(),
    feedback: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

/**
 * API response schemas
 */
export const SessionGetResponseSchema = z.object({
  success: z.boolean(),
  data: SessionDataSchema.optional(),
  error: z.string().optional(),
});

export const SessionSetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

/**
 * Request schemas
 */
export const SetAssessmentRequestSchema = z.object({
  assessment: AssessmentDataSchema,
  completionId: z.string(),
});

export const SetConversationIdRequestSchema = z.object({
  conversationId: z.string(),
});

export const SetConversationCompleteRequestSchema = z.object({
  complete: z.boolean(),
});

/**
 * Type exports
 */
export type AssessmentData = z.infer<typeof AssessmentDataSchema>;
export type SessionData = z.infer<typeof SessionDataSchema>;
export type SessionGetResponse = z.infer<typeof SessionGetResponseSchema>;
export type SessionSetResponse = z.infer<typeof SessionSetResponseSchema>;
export type SetAssessmentRequest = z.infer<typeof SetAssessmentRequestSchema>;
export type SetConversationIdRequest = z.infer<typeof SetConversationIdRequestSchema>;
export type SetConversationCompleteRequest = z.infer<typeof SetConversationCompleteRequestSchema>;
