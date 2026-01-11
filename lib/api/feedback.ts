import { BetaFeedbackSchema } from '@/lib/schemas/beta-feedback';
import { ApiError } from '@/lib/api/errors';
import {
  BetaFeedbackResponseSchema,
  FeedbackResponseSchema,
  NpsFeedbackRequestSchema,
  type BetaFeedbackResponse,
  type FeedbackResponse,
  type NpsFeedbackRequest,
} from '@/schemas/feedback.schema';

const parseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export async function submitBetaFeedback(
  data: unknown,
  authToken: string
): Promise<BetaFeedbackResponse> {
  const validated = BetaFeedbackSchema.parse(data);
  const response = await fetch('/api/beta-feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(validated),
  });

  const json = await parseJson(response);

  if (!response.ok) {
    const parsed = BetaFeedbackResponseSchema.safeParse(json);
    const message =
      parsed.success && parsed.data.message
        ? parsed.data.message
        : 'Failed to submit feedback';
    throw new ApiError(message, response.status, parsed.success ? parsed.data : json);
  }

  return BetaFeedbackResponseSchema.parse(json);
}

export async function submitNpsFeedback(
  data: NpsFeedbackRequest,
  authToken: string
): Promise<FeedbackResponse> {
  const validated = NpsFeedbackRequestSchema.parse(data);
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(validated),
  });

  const json = await parseJson(response);

  if (!response.ok) {
    const parsed = FeedbackResponseSchema.safeParse(json);
    const message =
      parsed.success && parsed.data.message
        ? parsed.data.message
        : 'Failed to submit feedback';
    throw new ApiError(message, response.status, parsed.success ? parsed.data : json);
  }

  return FeedbackResponseSchema.parse(json);
}
