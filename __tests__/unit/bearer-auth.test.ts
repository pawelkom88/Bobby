import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { enforceBearerRateLimit, verifyBearerUser } from '@/lib/bearer-auth';
import * as authUtils from '@/lib/auth-utils';
import * as tokenVerifier from '@/lib/token-verifier';
import * as rateLimit from '@/lib/rateLimit';

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  extractBearerToken: vi.fn(),
}));

vi.mock('@/lib/token-verifier', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  getClientIP: vi.fn(() => '127.0.0.1'),
}));

describe('bearer-auth helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unauthorized when token extraction fails', async () => {
    vi.mocked(authUtils.extractBearerToken).mockReturnValue({
      success: false,
      error: 'missing',
      message: 'Authentication token required',
    });

    const request = new NextRequest('http://localhost');
    const auth = { verifyIdToken: vi.fn() };
    const result = await verifyBearerUser(request, auth, 'unit-test');

    expect(result).toEqual({
      error: 'Authentication token required',
      status: 401,
    });
    expect(tokenVerifier.verifyToken).not.toHaveBeenCalled();
  });

  it('returns userId when token is verified', async () => {
    vi.mocked(authUtils.extractBearerToken).mockReturnValue({
      success: true,
      token: 'token',
    });
    vi.mocked(tokenVerifier.verifyToken).mockResolvedValue({
      success: true,
      uid: 'user-123',
    });

    const request = new NextRequest('http://localhost');
    const auth = { verifyIdToken: vi.fn() };
    const result = await verifyBearerUser(request, auth, 'unit-test');

    expect(result).toEqual({ userId: 'user-123' });
  });

  it('returns unauthorized when verification result is missing uid', async () => {
    vi.mocked(authUtils.extractBearerToken).mockReturnValue({
      success: true,
      token: 'token',
    });
    vi.mocked(tokenVerifier.verifyToken).mockResolvedValue({
      success: false,
    });

    const request = new NextRequest('http://localhost');
    const auth = { verifyIdToken: vi.fn() };
    const result = await verifyBearerUser(request, auth, 'unit-test');

    expect(result).toEqual({ error: 'Invalid token', status: 401 });
  });

  it('returns unauthorized when verification throws', async () => {
    vi.mocked(authUtils.extractBearerToken).mockReturnValue({
      success: true,
      token: 'token',
    });
    vi.mocked(tokenVerifier.verifyToken).mockRejectedValue(
      new Error('boom')
    );

    const request = new NextRequest('http://localhost');
    const auth = { verifyIdToken: vi.fn() };
    const result = await verifyBearerUser(request, auth, 'unit-test');

    expect(result).toEqual({ error: 'Invalid token', status: 401 });
  });

  it('returns response when rate limit is exceeded', async () => {
    const limiter = {
      isRateLimited: vi.fn().mockResolvedValue({
        limited: true,
        remaining: 0,
        resetTime: Date.now() + 1000,
      }),
    };

    const request = new NextRequest('http://localhost');
    const response = await enforceBearerRateLimit(
      request,
      'user-123',
      limiter,
      'unit-test',
      () => NextResponse.json({ error: 'rate-limited' }, { status: 429 })
    );

    expect(response?.status).toBe(429);
  });

  it('returns null when rate limit is not exceeded', async () => {
    const limiter = {
      isRateLimited: vi.fn().mockResolvedValue({
        limited: false,
        remaining: 5,
        resetTime: Date.now() + 1000,
      }),
    };

    const request = new NextRequest('http://localhost');
    const response = await enforceBearerRateLimit(
      request,
      'user-123',
      limiter,
      'unit-test',
      () => NextResponse.json({ error: 'rate-limited' }, { status: 429 })
    );

    expect(response).toBeNull();
  });
});
