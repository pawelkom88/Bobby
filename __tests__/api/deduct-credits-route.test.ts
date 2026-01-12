import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as deductCredits } from '@/app/api/deduct-credits/route';
import { createJsonRequest, readJson } from './route-test-helpers';
import * as bearerAuth from '@/lib/bearer-auth';
import * as firebaseAdmin from '@/lib/firebase-admin';
import * as ownershipValidator from '@/lib/ownership-validator';
import { CreditTransactionError } from '@/lib/credit-transaction';

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

vi.mock('@/lib/bearer-auth', () => ({
  verifyBearerUser: vi.fn(),
  enforceBearerRateLimit: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiters: { strict: { isRateLimited: vi.fn() } },
  createRateLimitHeaders: vi.fn(() => ({})),
  getClientIP: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/ownership-validator', () => ({
  validateOwnership: vi.fn(),
  OwnershipValidationError: class OwnershipValidationError extends Error {
    constructor(public code: string, message: string) {
      super(message);
    }
  },
}));

vi.mock('@/lib/charge-eligibility', () => ({
  isEligibleForCharge: vi.fn(() => ({ isEligible: true })),
}));

vi.mock('@/lib/conversation-storage', () => ({
  getConversation: vi.fn(),
}));

vi.mock('@/lib/credit-transaction', () => ({
  performDeduction: vi.fn(),
  CreditTransactionError: class CreditTransactionError extends Error {
    constructor(public code: string, message: string) {
      super(message);
    }
  },
}));

describe('Deduct credits API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firebaseAdmin.getAdminAuth).mockReturnValue({} as any);
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({ exists: false }),
        })),
      })),
      runTransaction: vi.fn(),
    } as any);
    vi.mocked(bearerAuth.enforceBearerRateLimit).mockResolvedValue(null);
    vi.mocked(ownershipValidator.validateOwnership).mockResolvedValue({
      isOwner: true,
      userId: 'user-123',
      conversationId: 'conv-1',
    });
  });

  it('returns 401 when bearer token is invalid', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      error: 'Invalid token',
      status: 401,
    });

    const request = createJsonRequest('http://localhost/api/deduct-credits', {
      body: {
        conversationId: 'conv-1',
        durationSeconds: 45,
      },
    });
    const response = await deductCredits(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('unauthorized');
  });

  it('returns 400 when request body is invalid', async () => {
    const request = createJsonRequest('http://localhost/api/deduct-credits', {
      body: {},
    });

    const response = await deductCredits(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe('invalid-request');
  });

  it('returns 403 when ownership validation fails', async () => {
    const OwnershipValidationError = vi.mocked(
      ownershipValidator
    ).OwnershipValidationError as unknown as {
      new (code: string, message: string): Error;
    };
    vi.mocked(ownershipValidator.validateOwnership).mockRejectedValue(
      new OwnershipValidationError('auth/not-authorized', 'Not authorized')
    );
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      userId: 'user-123',
    });

    const request = createJsonRequest('http://localhost/api/deduct-credits', {
      body: { conversationId: 'conv-1' },
    });

    const response = await deductCredits(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe('not-authorized');
  });

  it('returns 200 when conversation is already charged', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      userId: 'user-123',
    });
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn((name: string) => {
        if (name === 'creditDeductions') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({ exists: true }),
            })),
          };
        }
        if (name === 'users') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  credits: 2,
                  betaUser: false,
                  betaCredits: 0,
                }),
              }),
            })),
          };
        }
        return {
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ exists: false }),
          })),
        };
      }),
    } as any);

    const request = createJsonRequest('http://localhost/api/deduct-credits', {
      body: { conversationId: 'conv-1' },
    });

    const response = await deductCredits(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(200);
    expect(body.error).toBe('already-charged');
  });

  it('returns 402 when credits are insufficient', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      userId: 'user-123',
    });
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn((name: string) => {
        if (name === 'conversations') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({
                exists: true,
                id: 'conv-1',
                data: () => ({
                  userId: 'user-123',
                  ageTier: 1,
                  service: 'fire',
                  startedAt: new Date().toISOString(),
                  endedAt: new Date(Date.now() + 1000).toISOString(),
                  status: 'completed',
                  charged: false,
                }),
              }),
            })),
          };
        }
        return {
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ exists: false }),
          })),
        };
      }),
      runTransaction: vi.fn().mockRejectedValue(
        new CreditTransactionError(
          'payment/insufficient-credits',
          'User has insufficient credits'
        )
      ),
    } as any);

    const request = createJsonRequest('http://localhost/api/deduct-credits', {
      body: { conversationId: 'conv-1' },
    });

    const response = await deductCredits(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(402);
    expect(body.error).toBe('insufficient-credits');
  });
});
