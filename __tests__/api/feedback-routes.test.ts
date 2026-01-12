import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as feedback } from '@/app/api/feedback/route';
import { POST as betaFeedback } from '@/app/api/beta-feedback/route';
import { createJsonRequest, readJson } from './route-test-helpers';
import * as firebaseAdmin from '@/lib/firebase-admin';
import * as authUtils from '@/lib/auth-utils';
import * as tokenVerifier from '@/lib/token-verifier';
import * as bearerAuth from '@/lib/bearer-auth';
import * as rateLimit from '@/lib/rateLimit';

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/auth-utils', () => ({
  extractBearerToken: vi.fn(),
}));

vi.mock('@/lib/token-verifier', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/bearer-auth', () => ({
  verifyBearerUser: vi.fn(),
  enforceBearerRateLimit: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiters: {
    api: { isRateLimited: vi.fn() },
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
  createRateLimitHeaders: vi.fn(() => ({})),
}));

describe('Feedback API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BETA_MODE_ENABLED = 'true';
  });

  it('rejects invalid feedback payloads', async () => {
    vi.mocked(firebaseAdmin.getAdminAuth).mockReturnValue({});
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({});

    const request = createJsonRequest('http://localhost/api/feedback', {
      body: { childAge: '', scenarios: [] },
    });
    const response = await feedback(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid feedback data');
  });

  it('rejects feedback for non-beta users', async () => {
    vi.mocked(authUtils.extractBearerToken).mockReturnValue({
      success: true,
      token: 'token',
    });
    vi.mocked(firebaseAdmin.getAdminAuth).mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-123' }),
    });
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ betaUser: false }),
          }),
        })),
      })),
    });
    vi.mocked(tokenVerifier.verifyToken).mockResolvedValue({
      success: true,
      uid: 'user-123',
    });

    const request = createJsonRequest('http://localhost/api/feedback', {
      body: {
        childAge: '10',
        scenarios: ['fire'],
        easeOfUnderstanding: 4,
        childFeelings: 'ok',
        safetyRating: 4,
        practiceClarity: 'clear',
        usefulness: 'high',
        wouldUseAgain: 'yes',
        npsScore: 8,
        contactOptIn: false,
      },
    });
    const response = await feedback(request);
    const body = await readJson<{ error: string; message?: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe('unauthorized');
    expect(body.message).toBe('Only beta users can submit feedback');
  });

  it('rejects beta-feedback payloads that fail validation', async () => {
    vi.mocked(firebaseAdmin.getAdminAuth).mockReturnValue({});
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({});

    const request = createJsonRequest('http://localhost/api/beta-feedback', {
      body: { scenario: 1 },
    });
    const response = await betaFeedback(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe('invalid-request');
  });

  it('returns 429 when feedback rate limit is exceeded', async () => {
    vi.mocked(authUtils.extractBearerToken).mockReturnValue({
      success: true,
      token: 'token',
    });
    vi.mocked(firebaseAdmin.getAdminAuth).mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-123' }),
    });
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ betaUser: true }),
          }),
        })),
      })),
    });
    vi.mocked(tokenVerifier.verifyToken).mockResolvedValue({
      success: true,
      uid: 'user-123',
    });
    vi.mocked(rateLimit.rateLimiters.api.isRateLimited).mockResolvedValue({
      limited: true,
      remaining: 0,
      resetTime: Date.now() + 1000,
    });

    const request = createJsonRequest('http://localhost/api/feedback', {
      body: {
        childAge: '10',
        scenarios: ['fire'],
        easeOfUnderstanding: 4,
        childFeelings: 'ok',
        safetyRating: 4,
        practiceClarity: 'clear',
        usefulness: 'high',
        wouldUseAgain: 'yes',
        npsScore: 8,
        contactOptIn: false,
      },
    });
    const response = await feedback(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(429);
    expect(body.error).toBe('rate-limited');
  });

  it('returns 404 when beta feedback references missing conversation', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      userId: 'user-123',
    });
    vi.mocked(bearerAuth.enforceBearerRateLimit).mockResolvedValue(null);
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({ exists: false }),
        })),
        add: vi.fn(),
      })),
    } as any);

    const request = createJsonRequest('http://localhost/api/beta-feedback', {
      body: {
        numberOfChildren: '1',
        priorPractice: 'no',
        discoveryChannels: ['friend'],
        childFeelingsBefore: 'scared',
        childFeelingsAfter: 'ok',
        easeOfUnderstanding: 4,
        discomfortLevel: 'none',
        usefulness: 'high',
        confidenceChange: 'positive',
        starterPriceFeedback: 'ok',
        heroPriceFeedback: 'ok',
        preferredPricingModel: 'one-time',
        npsScore: 7,
        improveFirst: 'more scenarios',
        contactMethod: 'none',
        conversationId: 'conv-404',
      },
    });
    const response = await betaFeedback(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(404);
    expect(body.error).toBe('conversation-not-found');
  });
});
