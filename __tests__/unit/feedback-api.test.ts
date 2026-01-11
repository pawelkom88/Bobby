import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitBetaFeedback, submitNpsFeedback } from '../../lib/api/feedback';
import { ApiError } from '../../lib/api/errors';
import type { BetaFeedbackData } from '../../lib/schemas/beta-feedback';

const fetchMock = vi.fn();

const validBetaFeedback: BetaFeedbackData = {
  numberOfChildren: '1',
  priorPractice: 'no',
  discoveryChannels: ['instagram'],
  childFeelingsBefore: 'nervous',
  childFeelingsAfter: 'calm',
  easeOfUnderstanding: 3,
  discomfortLevel: 'noConcerns',
  discomfortDetails: '',
  usefulness: 'high',
  confidenceChange: 'increased',
  desiredScenarios: [],
  desiredScenariosOther: '',
  starterPriceFeedback: 'ok',
  heroPriceFeedback: 'ok',
  preferredPricingModel: 'oneTime',
  npsScore: 7,
  recommendReason: 'helpful',
  interests: [],
  improveFirst: 'more scenarios',
  contactMethod: 'email',
  contactEmail: 'test@example.com',
  contactPhone: '',
  conversationId: 'conv-1',
};

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('feedback api', () => {
  it('submitNpsFeedback sends payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      json: async () => ({ success: true }),
    });

    const response = await submitNpsFeedback(
      { score: 8, comment: 'Nice', conversationId: 'c1' },
      'token'
    );

    expect(response.success).toBe(true);
  });

  it('submitBetaFeedback throws ApiError for invalid request', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        success: false,
        error: 'invalid-request',
        message: 'contactEmail: EMAIL_REQUIRED',
      }),
    });

    await expect(
      submitBetaFeedback(validBetaFeedback, 'token')
    ).rejects.toBeInstanceOf(ApiError);
  });
});
