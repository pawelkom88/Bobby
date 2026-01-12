import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { requireSessionUser } from '@/lib/session-request';
import * as authUtils from '@/lib/auth-utils';
import * as firebaseAdmin from '@/lib/firebase-admin';
import * as rateLimit from '@/lib/rateLimit';

vi.mock('@/lib/auth-utils', () => ({
  extractAndValidateToken: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  getClientIP: vi.fn(() => '127.0.0.1'),
  createRateLimitHeaders: vi.fn(() => ({ 'x-ratelimit-remaining': '0' })),
}));

describe('requireSessionUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when token is missing', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue(null);

    const request = new NextRequest('http://localhost');
    const limiter = {
      isRateLimited: vi.fn(),
    };

    const result = await requireSessionUser(
      request,
      'unit-test',
      'unit-test',
      limiter
    );

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(401);
    }
  });

  it('returns 401 when token verification fails', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockRejectedValue(
      new Error('invalid')
    );

    const request = new NextRequest('http://localhost');
    const limiter = {
      isRateLimited: vi.fn(),
    };

    const result = await requireSessionUser(
      request,
      'unit-test',
      'unit-test',
      limiter
    );

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(401);
    }
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({ uid: 'user-123' });

    const limiter = {
      isRateLimited: vi.fn().mockResolvedValue({
        limited: true,
        remaining: 0,
        resetTime: Date.now() + 1000,
      }),
    };

    const request = new NextRequest('http://localhost');
    const result = await requireSessionUser(
      request,
      'unit-test',
      'unit-test',
      limiter
    );

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(429);
    }
  });

  it('returns userId when authorized and not rate limited', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({ uid: 'user-123' });

    const limiter = {
      isRateLimited: vi.fn().mockResolvedValue({
        limited: false,
        remaining: 10,
        resetTime: Date.now() + 1000,
      }),
    };

    const request = new NextRequest('http://localhost');
    const result = await requireSessionUser(
      request,
      'unit-test',
      'unit-test',
      limiter
    );

    if (result instanceof Response) {
      throw new Error('Expected userId result');
    }

    expect(result.userId).toBe('user-123');
  });
});
