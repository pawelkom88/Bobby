import { z } from 'zod';

export const BetaFeedbackSchema = z
  .object({
    // Section 1: Segmentation
    numberOfChildren: z.string().min(1, 'Number of children is required'),
    priorPractice: z.string().min(1, 'Prior practice is required'),
    discoveryChannels: z
      .array(z.string())
      .min(1, 'At least one discovery channel is required'),

    // Section 2: Emotional Journey
    childFeelingsBefore: z.string().min(1, 'Child feelings before is required'),
    childFeelingsAfter: z.string().min(1, 'Child feelings after is required'),
    easeOfUnderstanding: z.number().min(1).max(5),
    discomfortLevel: z.string().min(1, 'Discomfort level is required'),
    discomfortDetails: z.string().optional(),

    // Section 3: Value Perception
    usefulness: z.string().min(1, 'Usefulness is required'),
    confidenceChange: z.string().min(1, 'Confidence change is required'),
    desiredScenarios: z.array(z.string()).optional(),
    desiredScenariosOther: z.string().optional(),

    // Section 4: Pricing Validation
    starterPriceFeedback: z.string().min(1, 'Starter price feedback is required'),
    heroPriceFeedback: z.string().min(1, 'Hero price feedback is required'),
    preferredPricingModel: z.string().min(1, 'Preferred pricing model is required'),

    // Section 5: Referral & NPS
    npsScore: z.number().min(0).max(10),
    recommendReason: z.string().optional(),
    interests: z.array(z.string()).optional(),

    // Section 6: Closing
    improveFirst: z.string().min(1, 'Improvement suggestion is required'),
    contactMethod: z.string().min(1, 'Contact preference is required'),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),

    // Metadata
    conversationId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If contact method is email, email is required and must be valid
    if (data.contactMethod === 'email') {
      if (!data.contactEmail || data.contactEmail.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'EMAIL_REQUIRED',
          path: ['contactEmail'],
        });
      } else {
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

    // If contact method is phone, phone is required
    if (data.contactMethod === 'phone') {
      if (!data.contactPhone || data.contactPhone.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'PHONE_REQUIRED',
          path: ['contactPhone'],
        });
      }
    }

    // If discomfort level indicates concerns, details should be provided
    if (
      (data.discomfortLevel === 'someConcerns' ||
        data.discomfortLevel === 'significantConcerns') &&
      (!data.discomfortDetails || data.discomfortDetails.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DISCOMFORT_DETAILS_REQUIRED',
        path: ['discomfortDetails'],
      });
    }
  });

export type BetaFeedbackData = z.infer<typeof BetaFeedbackSchema>;
