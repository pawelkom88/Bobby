import { z } from 'zod';

export const BetaFeedbackSchema = z
  .object({
    childAge: z.string().min(1, 'Child age is required'),
    scenarios: z.array(z.string()).min(1, 'At least one scenario is required'),
    easeOfUnderstanding: z.number().min(1).max(5),
    childFeelings: z.string().min(1, 'Child feelings is required'),
    uncomfortable: z.string().optional(),
    safetyRating: z.number().min(1).max(5),
    practiceClarity: z.string().min(1, 'Practice clarity is required'),
    usefulness: z.string().min(1, 'Usefulness is required'),
    wouldUseAgain: z.string().min(1, 'Would use again is required'),
    willingToPay: z.string().min(1, 'Willing to pay is required'),
    npsScore: z.number().min(0).max(10),
    likedMost: z.string().optional(),
    improveFirst: z.string().optional(),
    contactOptIn: z.boolean(),
    contactEmail: z.string().optional(),
    conversationId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If contactOptIn is true, email is required and must be valid
    if (data.contactOptIn === true) {
      if (!data.contactEmail || data.contactEmail.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'EMAIL_REQUIRED_WHEN_OPT_IN',
          path: ['contactEmail'],
        });
      } else {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.contactEmail)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'INVALID_EMAIL',
            path: ['contactEmail'],
          });
        }
      }
    }
  });

export type BetaFeedbackData = z.infer<typeof BetaFeedbackSchema>;
