import { z } from 'zod';

const ServiceSchema = z.enum(['fire', 'ambulance', 'police']);
const AgeTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const ConversationMessageSchema = z.object({
  type: z.enum(['user', 'agent']),
  text: z.string(),
  timestamp: z.string(),
});

export const ConversationListItemSchema = z.object({
  id: z.string(),
  service: ServiceSchema,
  ageTier: AgeTierSchema,
  startedAt: z.string(),
  endedAt: z.string().optional(),
  messageCount: z.number(),
});

export const StoredConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  ageTier: AgeTierSchema,
  service: ServiceSchema,
  startedAt: z.string(),
  endedAt: z.string().optional(),
  status: z.enum(['active', 'completed']),
  charged: z.boolean(),
  messages: z.array(ConversationMessageSchema).optional(),
});

export const AssessedConversationSchema = z.object({
  id: z.string(),
  service: ServiceSchema,
  ageTier: AgeTierSchema,
  startedAt: z.string(),
  endedAt: z.string().optional(),
  messageCount: z.number(),
  xpEarned: z.number(),
  score: z.number().optional(),
  feedback: z.array(z.string()).optional(),
});

export const ConversationsListResponseSchema = z.object({
  success: z.boolean(),
  conversations: z.array(ConversationListItemSchema).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const ConversationDetailResponseSchema = z.object({
  success: z.boolean(),
  conversation: StoredConversationSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const AssessedConversationsResponseSchema = z.object({
  success: z.boolean(),
  conversations: z.array(AssessedConversationSchema).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ConversationListItem = z.infer<typeof ConversationListItemSchema>;
export type StoredConversation = z.infer<typeof StoredConversationSchema>;
export type AssessedConversation = z.infer<typeof AssessedConversationSchema>;
