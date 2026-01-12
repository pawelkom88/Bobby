import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { POST as deleteAccount } from '@/app/api/account/delete/route';
import { createJsonRequest, readJson } from './route-test-helpers';
import * as bearerAuth from '@/lib/bearer-auth';
import * as firebaseAdmin from '@/lib/firebase-admin';

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

vi.mock('@/lib/session-storage', () => ({
  clearAllSessionValues: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiters: { strict: { isRateLimited: vi.fn() } },
  createRateLimitHeaders: vi.fn(() => ({})),
}));

vi.mock('@/lib/mailer', () => ({
  sendGoodbyeEmail: vi.fn(),
}));

describe('Account delete API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firebaseAdmin.getAdminAuth).mockReturnValue({
      getUser: vi.fn(),
      deleteUser: vi.fn(),
    } as any);
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
        })),
      })),
      batch: vi.fn(() => ({
        delete: vi.fn(),
        commit: vi.fn(),
      })),
    } as any);
  });

  it('returns 401 when bearer token is invalid', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      error: 'Invalid token',
      status: 401,
    });

    const request = createJsonRequest('http://localhost/api/account/delete');
    const response = await deleteAccount(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('unauthorized');
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      userId: 'user-123',
    });
    vi.mocked(bearerAuth.enforceBearerRateLimit).mockResolvedValue(
      NextResponse.json(
        { success: false, error: 'rate-limited' },
        { status: 429 }
      )
    );

    const request = createJsonRequest('http://localhost/api/account/delete');
    const response = await deleteAccount(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(429);
    expect(body.error).toBe('rate-limited');
  });

  it('returns 500 when deletion fails', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      userId: 'user-123',
    });
    vi.mocked(bearerAuth.enforceBearerRateLimit).mockResolvedValue(null);
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn().mockRejectedValue(new Error('boom')),
        })),
      })),
    } as any);

    const request = createJsonRequest('http://localhost/api/account/delete');
    const response = await deleteAccount(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe('deletion-failed');
  });

  it('returns success when auth user is already deleted', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      userId: 'user-123',
    });
    vi.mocked(bearerAuth.enforceBearerRateLimit).mockResolvedValue(null);
    vi.mocked(firebaseAdmin.getAdminAuth).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({
        email: 'test@example.com',
        displayName: 'Tester',
      }),
      deleteUser: vi.fn().mockRejectedValue({ code: 'auth/user-not-found' }),
    } as any);
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
        })),
        doc: vi.fn(() => ({
          delete: vi.fn(),
        })),
      })),
      batch: vi.fn(() => ({
        delete: vi.fn(),
        commit: vi.fn(),
      })),
    } as any);

    const request = createJsonRequest('http://localhost/api/account/delete');
    const response = await deleteAccount(request);
    const body = await readJson<{ success: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
